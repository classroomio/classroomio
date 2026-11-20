import * as schema from '@db/schema';

import { and, desc, eq } from 'drizzle-orm';

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
