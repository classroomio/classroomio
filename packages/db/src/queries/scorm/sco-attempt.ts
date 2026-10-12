import * as schema from '@db/schema';

import { and, asc, eq } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewScormScoAttempt, TScormAttempt, TScormScoAttempt } from '@db/types';

export async function getScoAttemptById(
  scoAttemptId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormScoAttempt | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.scormScoAttempt)
      .where(eq(schema.scormScoAttempt.id, scoAttemptId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getScoAttemptById error:', error);
    throw new Error(
      `Failed to get SCORM module try "${scoAttemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getOpenScoAttempt(
  attemptId: string,
  unitId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormScoAttempt | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.scormScoAttempt)
      .where(
        and(
          eq(schema.scormScoAttempt.attemptId, attemptId),
          eq(schema.scormScoAttempt.unitId, unitId),
          eq(schema.scormScoAttempt.status, 'active')
        )
      )
      .limit(1);

    if (row) return row;

    const [suspended] = await dbClient
      .select()
      .from(schema.scormScoAttempt)
      .where(
        and(
          eq(schema.scormScoAttempt.attemptId, attemptId),
          eq(schema.scormScoAttempt.unitId, unitId),
          eq(schema.scormScoAttempt.status, 'suspended')
        )
      )
      .limit(1);

    return suspended ?? null;
  } catch (error) {
    console.error('getOpenScoAttempt error:', error);
    throw new Error(
      `Failed to get open SCORM module try for attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface LockedScoAttempt {
  attempt: TScormAttempt;
  scoAttempt: TScormScoAttempt;
}

/**
 * Locks the attempt row first, then the module try, so commits from two
 * modules of one learner serialize. Must run inside a transaction.
 */
export async function lockScoAttemptChain(
  scoAttemptId: string,
  dbClient: DbOrTxClient
): Promise<LockedScoAttempt | null> {
  try {
    const [scoAttempt] = await dbClient
      .select()
      .from(schema.scormScoAttempt)
      .where(eq(schema.scormScoAttempt.id, scoAttemptId))
      .limit(1);
    if (!scoAttempt) return null;

    const [attempt] = await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(eq(schema.scormAttempt.id, scoAttempt.attemptId))
      .limit(1)
      .for('update');
    if (!attempt) return null;

    const [locked] = await dbClient
      .select()
      .from(schema.scormScoAttempt)
      .where(eq(schema.scormScoAttempt.id, scoAttemptId))
      .limit(1)
      .for('update');

    return locked ? { attempt, scoAttempt: locked } : null;
  } catch (error) {
    console.error('lockScoAttemptChain error:', error);
    throw new Error(
      `Failed to lock SCORM module try "${scoAttemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createScoAttempt(
  values: TNewScormScoAttempt,
  dbClient: DbOrTxClient = db
): Promise<TScormScoAttempt> {
  try {
    const [created] = await dbClient.insert(schema.scormScoAttempt).values(values).returning();
    if (!created) throw new Error('Insert returned no row');

    return created;
  } catch (error) {
    console.error('createScoAttempt error:', error);
    throw new Error(
      `Failed to create SCORM module try for attempt "${values.attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateScoAttempt(
  scoAttemptId: string,
  patch: Partial<TScormScoAttempt>,
  dbClient: DbOrTxClient = db
): Promise<TScormScoAttempt | null> {
  try {
    const [updated] = await dbClient
      .update(schema.scormScoAttempt)
      .set(patch)
      .where(eq(schema.scormScoAttempt.id, scoAttemptId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateScoAttempt error:', error);
    throw new Error(
      `Failed to update SCORM module try "${scoAttemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns every try of an attempt, oldest first.
 */
export async function listScoAttemptsByAttempt(
  attemptId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormScoAttempt[]> {
  try {
    return await dbClient
      .select()
      .from(schema.scormScoAttempt)
      .where(eq(schema.scormScoAttempt.attemptId, attemptId))
      .orderBy(asc(schema.scormScoAttempt.startedAt));
  } catch (error) {
    console.error('listScoAttemptsByAttempt error:', error);
    throw new Error(
      `Failed to list SCORM module tries for attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the latest try per module of an attempt, newest first.
 */
export async function listLatestScoAttemptsByAttempt(
  attemptId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormScoAttempt[]> {
  try {
    const rows = await listScoAttemptsByAttempt(attemptId, dbClient);
    const latestByUnit = new Map<string, TScormScoAttempt>();

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows[index];
      if (row && !latestByUnit.has(row.unitId)) latestByUnit.set(row.unitId, row);
    }

    return [...latestByUnit.values()];
  } catch (error) {
    console.error('listLatestScoAttemptsByAttempt error:', error);
    throw new Error(
      `Failed to list latest SCORM module tries for attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
