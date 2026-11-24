import * as schema from '@db/schema';

import { and, desc, eq, inArray, lt, max } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourseBuildJob, TNewCourseBuildJob } from '@db/types';

type CourseBuildJobPatch = Partial<Omit<TNewCourseBuildJob, 'id' | 'organizationId' | 'profileId' | 'createdAt'>>;

export async function createCourseBuildJob(
  values: TNewCourseBuildJob,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildJob> {
  try {
    const [created] = await dbClient.insert(schema.courseBuildJob).values(values).returning();
    if (!created) throw new Error('No row returned');

    return created;
  } catch (error) {
    console.error('createCourseBuildJob error:', error);
    throw new Error('Failed to create course build job');
  }
}

export async function getCourseBuildJobById(
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildJob | null> {
  try {
    const [job] = await dbClient
      .select()
      .from(schema.courseBuildJob)
      .where(eq(schema.courseBuildJob.id, jobId))
      .limit(1);

    return job ?? null;
  } catch (error) {
    console.error('getCourseBuildJobById error:', error);
    throw new Error('Failed to fetch course build job');
  }
}

export async function getLatestCourseBuildJob(
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildJob | null> {
  try {
    const [job] = await dbClient
      .select()
      .from(schema.courseBuildJob)
      .where(eq(schema.courseBuildJob.organizationId, organizationId))
      .orderBy(desc(schema.courseBuildJob.createdAt))
      .limit(1);

    return job ?? null;
  } catch (error) {
    console.error('getLatestCourseBuildJob error:', error);
    throw new Error('Failed to fetch course build job');
  }
}

export async function updateCourseBuildJob(
  jobId: string,
  patch: CourseBuildJobPatch,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildJob | null> {
  try {
    const [job] = await dbClient
      .update(schema.courseBuildJob)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(schema.courseBuildJob.id, jobId))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('updateCourseBuildJob error:', error);
    throw new Error('Failed to update course build job');
  }
}

/** Moves a PENDING job to RUNNING. Returns null when it was not pending, so a duplicate delivery does nothing. */
export async function claimCourseBuildJob(jobId: string, dbClient: DbOrTxClient = db): Promise<TCourseBuildJob | null> {
  try {
    const now = new Date().toISOString();
    const [job] = await dbClient
      .update(schema.courseBuildJob)
      .set({ status: 'RUNNING', stage: 'discover', startedAt: now, updatedAt: now })
      .where(and(eq(schema.courseBuildJob.id, jobId), eq(schema.courseBuildJob.status, 'PENDING')))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('claimCourseBuildJob error:', error);
    throw new Error('Failed to claim course build job');
  }
}

/**
 * Applies a patch only while the job is RUNNING, so a build canceled or failed in the meantime keeps its status.
 * Returns null when it was no longer running.
 */
export async function updateRunningCourseBuildJob(
  jobId: string,
  patch: CourseBuildJobPatch,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildJob | null> {
  try {
    const [job] = await dbClient
      .update(schema.courseBuildJob)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.courseBuildJob.id, jobId), eq(schema.courseBuildJob.status, 'RUNNING')))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('updateRunningCourseBuildJob error:', error);
    throw new Error('Failed to update course build job');
  }
}

/**
 * Adds one stage run's spend to the job: the total, each role's cost under `<stage>:<role>`, and the stage's seconds.
 * Read and written under a row lock, so stages finishing at once (one per course) never lose each other's spend.
 */
export async function addCourseBuildJobCost(
  jobId: string,
  stage: string,
  spend: { costUsd: number; byRole: Record<string, number>; seconds: number }
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const [job] = await tx
        .select({
          costUsd: schema.courseBuildJob.costUsd,
          costByRole: schema.courseBuildJob.costByRole,
          secondsByStage: schema.courseBuildJob.secondsByStage
        })
        .from(schema.courseBuildJob)
        .where(eq(schema.courseBuildJob.id, jobId))
        .for('update');
      if (!job) return;

      const costByRole = { ...job.costByRole };
      for (const [role, cost] of Object.entries(spend.byRole)) {
        const key = `${stage}:${role}`;
        costByRole[key] = (costByRole[key] ?? 0) + cost;
      }
      const secondsByStage = { ...job.secondsByStage, [stage]: (job.secondsByStage[stage] ?? 0) + spend.seconds };
      const costUsd = job.costUsd + spend.costUsd;

      await tx
        .update(schema.courseBuildJob)
        .set({ costUsd, costByRole, secondsByStage, updatedAt: new Date().toISOString() })
        .where(eq(schema.courseBuildJob.id, jobId));
    });
  } catch (error) {
    console.error('addCourseBuildJobCost error:', error);
    throw new Error('Failed to record course build cost');
  }
}

/** Cancels a build that is pending or running; its next stage then does nothing. Returns null when it had ended. */
export async function cancelCourseBuildJob(
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildJob | null> {
  try {
    const now = new Date().toISOString();
    const [job] = await dbClient
      .update(schema.courseBuildJob)
      .set({ status: 'CANCELED', stage: 'done', finishedAt: now, updatedAt: now })
      .where(and(eq(schema.courseBuildJob.id, jobId), inArray(schema.courseBuildJob.status, ['PENDING', 'RUNNING'])))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('cancelCourseBuildJob error:', error);
    throw new Error('Failed to cancel course build job');
  }
}

/**
 * Fails builds that stopped making progress: a worker that died, or a stage whose promise hung, leaves the row RUNNING
 * and nothing updates it, so the preparing screen would wait on it forever. A build counts as moving while its job row,
 * one of its sources or one of its sites' courses was written since `staleBeforeIso`; the rest are failed, with their
 * unfinished sources, and returned so the caller can log or notify.
 */
export async function reapStalledCourseBuildJobs(
  staleBeforeIso: string,
  dbClient: DbOrTxClient = db
): Promise<Pick<TCourseBuildJob, 'id' | 'organizationId' | 'profileId' | 'stage'>[]> {
  try {
    const candidates = await dbClient
      .select({
        id: schema.courseBuildJob.id,
        organizationId: schema.courseBuildJob.organizationId,
        profileId: schema.courseBuildJob.profileId,
        stage: schema.courseBuildJob.stage,
        updatedAt: schema.courseBuildJob.updatedAt
      })
      .from(schema.courseBuildJob)
      .where(and(eq(schema.courseBuildJob.status, 'RUNNING'), lt(schema.courseBuildJob.updatedAt, staleBeforeIso)));
    if (!candidates.length) return [];

    const stalled: typeof candidates = [];
    for (const job of candidates) {
      const [sources] = await dbClient
        .select({ last: max(schema.courseBuildSource.updatedAt) })
        .from(schema.courseBuildSource)
        .where(eq(schema.courseBuildSource.jobId, job.id));
      const [courses] = await dbClient
        .select({ last: max(schema.courseBuildCourse.updatedAt) })
        .from(schema.courseBuildCourse)
        .where(eq(schema.courseBuildCourse.jobId, job.id));

      const last = [job.updatedAt, sources?.last, courses?.last]
        .filter((value): value is string => !!value)
        .sort()
        .pop();
      if (last && last >= staleBeforeIso) continue;

      stalled.push(job);
    }
    if (!stalled.length) return [];

    const ids = stalled.map((job) => job.id);
    const now = new Date().toISOString();
    const error = { code: 'STALLED', message: 'The build stopped moving and was closed' };
    await dbClient
      .update(schema.courseBuildSource)
      .set({ status: 'FAILED', error, updatedAt: now })
      .where(
        and(
          inArray(schema.courseBuildSource.jobId, ids),
          inArray(schema.courseBuildSource.status, ['PENDING', 'READING'])
        )
      );
    await dbClient
      .update(schema.courseBuildJob)
      .set({ status: 'FAILED', stage: 'done', finishedAt: now, updatedAt: now, error })
      .where(and(inArray(schema.courseBuildJob.id, ids), eq(schema.courseBuildJob.status, 'RUNNING')));

    return stalled.map(({ id, organizationId, profileId, stage }) => ({ id, organizationId, profileId, stage }));
  } catch (error) {
    console.error('reapStalledCourseBuildJobs error:', error);
    throw new Error('Failed to reap stalled course builds');
  }
}
