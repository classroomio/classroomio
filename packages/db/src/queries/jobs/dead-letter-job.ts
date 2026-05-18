import * as schema from '@db/schema';

import { and, desc, eq, lt } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TDeadLetterJob, TNewDeadLetterJob } from '@db/types';

/**
 * Dead-letter ledger. Populated on attempt exhaustion or explicit failure;
 * consumed by the admin UI for replay/triage and by maintenance retention.
 */

export async function recordDeadLetterJob(
  values: TNewDeadLetterJob,
  dbClient: DbOrTxClient = db
): Promise<TDeadLetterJob> {
  try {
    const [row] = await dbClient.insert(schema.deadLetterJob).values(values).returning();
    if (!row) {
      throw new Error('Insert returned no row');
    }

    return row;
  } catch (error) {
    console.error('recordDeadLetterJob error:', error);
    throw new Error('Failed to record dead-letter job');
  }
}

export async function listDeadLetterJobs(
  options: { domain?: string; organizationId?: string; limit?: number } = {}
): Promise<TDeadLetterJob[]> {
  try {
    const limit = options.limit ?? 100;
    const conditions = [];
    if (options.domain) {
      conditions.push(eq(schema.deadLetterJob.domain, options.domain));
    }
    if (options.organizationId) {
      conditions.push(eq(schema.deadLetterJob.organizationId, options.organizationId));
    }

    return await db
      .select()
      .from(schema.deadLetterJob)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.deadLetterJob.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('listDeadLetterJobs error:', error);
    throw new Error('Failed to list dead-letter jobs');
  }
}

export async function markDeadLetterReplayed(deadLetterId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await dbClient
      .update(schema.deadLetterJob)
      .set({ replayedAt: new Date().toISOString() })
      .where(eq(schema.deadLetterJob.id, deadLetterId));
  } catch (error) {
    console.error('markDeadLetterReplayed error:', error);
    throw new Error('Failed to mark dead-letter job replayed');
  }
}

export async function pruneDeadLetterJobsOlderThan(isoCutoff: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const deleted = await dbClient
      .delete(schema.deadLetterJob)
      .where(lt(schema.deadLetterJob.createdAt, isoCutoff))
      .returning({ id: schema.deadLetterJob.id });

    return deleted.length;
  } catch (error) {
    console.error('pruneDeadLetterJobsOlderThan error:', error);
    throw new Error('Failed to prune dead-letter jobs');
  }
}
