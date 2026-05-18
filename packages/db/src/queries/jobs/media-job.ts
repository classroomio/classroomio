import * as schema from '@db/schema';

import { and, desc, eq, inArray, sql } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TJobStatus, TMediaJob, TNewMediaJob } from '@db/types';

/**
 * Pure DB queries for `media_job`. Routes/services compose these and never
 * call drizzle directly. Catch blocks log the original error so failures are
 * traceable from API logs.
 */

export interface UpdateMediaJobInput {
  status?: TJobStatus;
  stage?: string | null;
  progressPercent?: number | null;
  rootJobId?: string | null;
  jobIds?: Record<string, string>;
  attempt?: number;
  costCents?: number;
  cancelRequestedAt?: string | null;
  result?: Record<string, unknown> | null;
  error?: { code: string; message: string; details?: unknown } | null;
  warnings?: string[];
}

export async function createMediaJob(values: TNewMediaJob, dbClient: DbOrTxClient = db): Promise<TMediaJob> {
  try {
    const [created] = await dbClient.insert(schema.mediaJob).values(values).returning();
    if (!created) {
      throw new Error('Insert returned no row');
    }

    return created;
  } catch (error) {
    console.error('createMediaJob error:', error);
    throw new Error('Failed to create media job');
  }
}

export async function getMediaJobById(jobId: string, orgId?: string): Promise<TMediaJob | null> {
  try {
    const conditions = [eq(schema.mediaJob.id, jobId)];
    if (orgId) {
      conditions.push(eq(schema.mediaJob.organizationId, orgId));
    }

    const [row] = await db
      .select()
      .from(schema.mediaJob)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getMediaJobById error:', error);
    throw new Error('Failed to get media job by id');
  }
}

export async function listMediaJobsByIds(jobIds: string[], orgId?: string): Promise<TMediaJob[]> {
  try {
    if (jobIds.length === 0) return [];

    const conditions = [inArray(schema.mediaJob.id, jobIds)];
    if (orgId) {
      conditions.push(eq(schema.mediaJob.organizationId, orgId));
    }

    return await db
      .select()
      .from(schema.mediaJob)
      .where(and(...conditions));
  } catch (error) {
    console.error('listMediaJobsByIds error:', error);
    throw new Error('Failed to list media jobs by ids');
  }
}

export async function listLatestMediaJobsByAsset(assetId: string, orgId: string): Promise<TMediaJob[]> {
  try {
    return await db
      .select()
      .from(schema.mediaJob)
      .where(and(eq(schema.mediaJob.assetId, assetId), eq(schema.mediaJob.organizationId, orgId)))
      .orderBy(desc(schema.mediaJob.createdAt));
  } catch (error) {
    console.error('listLatestMediaJobsByAsset error:', error);
    throw new Error('Failed to list latest media jobs for asset');
  }
}

export async function updateMediaJob(
  jobId: string,
  patch: UpdateMediaJobInput,
  dbClient: DbOrTxClient = db
): Promise<TMediaJob | null> {
  try {
    const [updated] = await dbClient
      .update(schema.mediaJob)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(schema.mediaJob.id, jobId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateMediaJob error:', error);
    throw new Error('Failed to update media job');
  }
}

export async function requestMediaJobCancel(
  jobId: string,
  orgId: string,
  dbClient: DbOrTxClient = db
): Promise<TMediaJob | null> {
  try {
    const [updated] = await dbClient
      .update(schema.mediaJob)
      .set({
        cancelRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.mediaJob.id, jobId),
          eq(schema.mediaJob.organizationId, orgId),
          // Don't reset cancellation if the worker already finished.
          sql`${schema.mediaJob.status} not in ('completed', 'failed', 'canceled')`
        )
      )
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('requestMediaJobCancel error:', error);
    throw new Error('Failed to request media job cancel');
  }
}
