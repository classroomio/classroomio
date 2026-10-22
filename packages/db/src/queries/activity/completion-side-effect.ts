import * as schema from '@db/schema';

import { and, asc, db, eq, inArray, lte, sql } from '@db/drizzle';

import type { DbOrTxClient } from '@db/drizzle';
import type { TActivityCompletionSideEffect } from '@db/types';

/**
 * Records that certification and compliance must run for each learner. Call it
 * in the transaction that writes the completion so the work commits with it.
 * Re-enqueueing a pending row bumps its generation and makes it due now.
 */
export async function enqueueActivityCompletionSideEffects(
  activityId: string,
  profileIds: string[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (profileIds.length === 0) return;

  try {
    const now = new Date().toISOString();
    const values = profileIds.map((profileId) => ({ activityId, profileId, nextAttemptAt: now }));

    await dbClient
      .insert(schema.activityCompletionSideEffect)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.activityCompletionSideEffect.activityId, schema.activityCompletionSideEffect.profileId],
        set: {
          certificationPending: true,
          compliancePending: true,
          generation: sql`${schema.activityCompletionSideEffect.generation} + 1`,
          attempts: 0,
          nextAttemptAt: now,
          lastError: null,
          updatedAt: now
        }
      });
  } catch (error) {
    console.error('enqueueActivityCompletionSideEffects error:', error);
    throw new Error(
      `Failed to enqueue completion side effects for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Claims up to `limit` due rows, skipping rows another worker holds, and leases
 * them until `leaseUntil` so a crash mid-run lets the next sweep retry them.
 * Pass `key` to claim only that learner's row.
 */
export async function claimDueActivityCompletionSideEffects(options: {
  limit: number;
  leaseUntil: string;
  key?: { activityId: string; profileId: string };
}): Promise<TActivityCompletionSideEffect[]> {
  try {
    return await db.transaction(async (tx) => {
      const table = schema.activityCompletionSideEffect;
      const now = new Date().toISOString();
      const keyFilter = options.key
        ? and(eq(table.activityId, options.key.activityId), eq(table.profileId, options.key.profileId))
        : undefined;
      const due = await tx
        .select({ id: table.id })
        .from(table)
        .where(and(lte(table.nextAttemptAt, now), keyFilter))
        .orderBy(asc(table.nextAttemptAt))
        .limit(options.limit)
        .for('update', { skipLocked: true });

      if (due.length === 0) return [];

      const dueIds = due.map((row) => row.id);

      return tx
        .update(table)
        .set({ attempts: sql`${table.attempts} + 1`, nextAttemptAt: options.leaseUntil, updatedAt: now })
        .where(inArray(table.id, dueIds))
        .returning();
    });
  } catch (error) {
    console.error('claimDueActivityCompletionSideEffects error:', error);
    throw new Error(
      `Failed to claim completion side effects: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stores the outcome of a claimed run. Deletes the row when nothing is left
 * pending, otherwise reschedules the remaining work. Does nothing when the row
 * was re-enqueued after the claim, because that newer generation is already due.
 */
export async function settleActivityCompletionSideEffect(
  claimed: Pick<TActivityCompletionSideEffect, 'id' | 'generation'>,
  outcome: {
    certificationPending: boolean;
    compliancePending: boolean;
    nextAttemptAt: string;
    lastError: string | null;
  }
): Promise<void> {
  try {
    const table = schema.activityCompletionSideEffect;
    const sameGeneration = and(eq(table.id, claimed.id), eq(table.generation, claimed.generation));

    if (!outcome.certificationPending && !outcome.compliancePending) {
      await db.delete(table).where(sameGeneration);
      return;
    }

    await db
      .update(table)
      .set({ ...outcome, updatedAt: new Date().toISOString() })
      .where(sameGeneration);
  } catch (error) {
    console.error('settleActivityCompletionSideEffect error:', error);
    throw new Error(
      `Failed to settle completion side effect "${claimed.id}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
