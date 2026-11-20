import * as schema from '@db/schema';

import { and, count, desc, eq, inArray } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewOnboardingStarterJob, TOnboardingStarterJob } from '@db/types';

const ACTIVE_STATUSES = ['PENDING', 'RUNNING'] as const;

/**
 * Inserts a job, or returns the job already running for the same organization and input.
 */
export async function createStarterJob(
  values: TNewOnboardingStarterJob,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingStarterJob> {
  try {
    const [created] = await dbClient
      .insert(schema.onboardingStarterJob)
      .values(values)
      .onConflictDoNothing()
      .returning();
    if (created) return created;

    const [active] = await dbClient
      .select()
      .from(schema.onboardingStarterJob)
      .where(
        and(
          eq(schema.onboardingStarterJob.organizationId, values.organizationId),
          eq(schema.onboardingStarterJob.inputHash, values.inputHash),
          inArray(schema.onboardingStarterJob.status, [...ACTIVE_STATUSES])
        )
      )
      .limit(1);

    if (!active) throw new Error('Failed to create starter job');

    return active;
  } catch (error) {
    console.error('createStarterJob error:', error);
    throw new Error('Failed to create starter job');
  }
}

export async function getStarterJobById(
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingStarterJob | null> {
  try {
    const [job] = await dbClient
      .select()
      .from(schema.onboardingStarterJob)
      .where(eq(schema.onboardingStarterJob.id, jobId))
      .limit(1);

    return job ?? null;
  } catch (error) {
    console.error('getStarterJobById error:', error);
    throw new Error('Failed to fetch starter job');
  }
}

export async function getLatestStarterJob(
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingStarterJob | null> {
  try {
    const [job] = await dbClient
      .select()
      .from(schema.onboardingStarterJob)
      .where(eq(schema.onboardingStarterJob.organizationId, organizationId))
      .orderBy(desc(schema.onboardingStarterJob.createdAt))
      .limit(1);

    return job ?? null;
  } catch (error) {
    console.error('getLatestStarterJob error:', error);
    throw new Error('Failed to fetch starter job');
  }
}

export async function countStarterJobs(organizationId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.onboardingStarterJob)
      .where(eq(schema.onboardingStarterJob.organizationId, organizationId));

    return row?.total ?? 0;
  } catch (error) {
    console.error('countStarterJobs error:', error);
    throw new Error('Failed to count starter jobs');
  }
}

export async function updateStarterJob(
  jobId: string,
  patch: Partial<Omit<TNewOnboardingStarterJob, 'id' | 'organizationId' | 'profileId' | 'createdAt'>>,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingStarterJob | null> {
  try {
    const [job] = await dbClient
      .update(schema.onboardingStarterJob)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(schema.onboardingStarterJob.id, jobId))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('updateStarterJob error:', error);
    throw new Error('Failed to update starter job');
  }
}

/**
 * Applies the final status of a job only while it is still RUNNING, so a job canceled in the meantime keeps its
 * CANCELED status. Returns null when the job was no longer running.
 */
export async function finishRunningStarterJob(
  jobId: string,
  patch: Partial<Omit<TNewOnboardingStarterJob, 'id' | 'organizationId' | 'profileId' | 'createdAt'>>,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingStarterJob | null> {
  try {
    const [job] = await dbClient
      .update(schema.onboardingStarterJob)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.onboardingStarterJob.id, jobId), eq(schema.onboardingStarterJob.status, 'RUNNING')))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('finishRunningStarterJob error:', error);
    throw new Error('Failed to finish starter job');
  }
}

/**
 * Moves a PENDING job to RUNNING. Returns null when another worker already claimed it or it was canceled.
 */
export async function claimStarterJob(
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TOnboardingStarterJob | null> {
  try {
    const now = new Date().toISOString();
    const [job] = await dbClient
      .update(schema.onboardingStarterJob)
      .set({ status: 'RUNNING', stage: 'understanding', startedAt: now, updatedAt: now })
      .where(and(eq(schema.onboardingStarterJob.id, jobId), eq(schema.onboardingStarterJob.status, 'PENDING')))
      .returning();

    return job ?? null;
  } catch (error) {
    console.error('claimStarterJob error:', error);
    throw new Error('Failed to claim starter job');
  }
}

export async function cancelActiveStarterJobs(organizationId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const now = new Date().toISOString();
    const canceled = await dbClient
      .update(schema.onboardingStarterJob)
      .set({ status: 'CANCELED', finishedAt: now, updatedAt: now })
      .where(
        and(
          eq(schema.onboardingStarterJob.organizationId, organizationId),
          inArray(schema.onboardingStarterJob.status, [...ACTIVE_STATUSES])
        )
      )
      .returning({ id: schema.onboardingStarterJob.id });

    return canceled.length;
  } catch (error) {
    console.error('cancelActiveStarterJobs error:', error);
    throw new Error('Failed to cancel starter jobs');
  }
}
