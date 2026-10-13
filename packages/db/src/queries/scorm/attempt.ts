import * as schema from '@db/schema';

import { and, desc, eq, inArray, isNull, sql } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewScormAttempt, TScormAttempt, TScormAttemptCloseReason } from '@db/types';

/**
 * Closes every open attempt pinned to an older version of the asset's package.
 * Returns the number of attempts closed.
 */
export async function closeSupersededAttempts(
  assetId: string,
  keepVersionId: string,
  reason: TScormAttemptCloseReason,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const olderVersions = await dbClient
      .select({ id: schema.contentPackageVersion.id })
      .from(schema.contentPackageVersion)
      .where(
        and(
          eq(schema.contentPackageVersion.assetId, assetId),
          sql`${schema.contentPackageVersion.id} != ${keepVersionId}`
        )
      );

    const versionIds = olderVersions.map((row) => row.id);
    if (versionIds.length === 0) return 0;

    const closedAt = new Date().toISOString();
    const closed = await dbClient
      .update(schema.scormAttempt)
      .set({ closedAt, closeReason: reason })
      .where(and(inArray(schema.scormAttempt.packageVersionId, versionIds), isNull(schema.scormAttempt.closedAt)))
      .returning({ id: schema.scormAttempt.id });

    return closed.length;
  } catch (error) {
    console.error('closeSupersededAttempts error:', error);
    throw new Error(
      `Failed to close superseded attempts for asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countOpenAttemptsForVersion(
  packageVersionId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const rows = await dbClient
      .select({ id: schema.scormAttempt.id })
      .from(schema.scormAttempt)
      .where(and(eq(schema.scormAttempt.packageVersionId, packageVersionId), isNull(schema.scormAttempt.closedAt)));

    return rows.length;
  } catch (error) {
    console.error('countOpenAttemptsForVersion error:', error);
    throw new Error(
      `Failed to count open attempts for version "${packageVersionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getScormAttemptById(
  attemptId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(eq(schema.scormAttempt.id, attemptId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getScormAttemptById error:', error);
    throw new Error(
      `Failed to get SCORM attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Locks the attempt row for update so concurrent launches and commits for
 * one learner serialize. Must run inside a transaction.
 */
export async function lockScormAttemptForUpdate(
  attemptId: string,
  dbClient: DbOrTxClient
): Promise<TScormAttempt | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(eq(schema.scormAttempt.id, attemptId))
      .limit(1)
      .for('update');

    return row ?? null;
  } catch (error) {
    console.error('lockScormAttemptForUpdate error:', error);
    throw new Error(
      `Failed to lock SCORM attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getOpenScormAttempt(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(
        and(
          eq(schema.scormAttempt.activityId, activityId),
          eq(schema.scormAttempt.profileId, profileId),
          isNull(schema.scormAttempt.closedAt)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getOpenScormAttempt error:', error);
    throw new Error(
      `Failed to get open SCORM attempt for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLatestScormAttempt(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(and(eq(schema.scormAttempt.activityId, activityId), eq(schema.scormAttempt.profileId, profileId)))
      .orderBy(desc(schema.scormAttempt.attemptNumber))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLatestScormAttempt error:', error);
    throw new Error(
      `Failed to get latest SCORM attempt for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countScormAttempts(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const rows = await dbClient
      .select({ id: schema.scormAttempt.id })
      .from(schema.scormAttempt)
      .where(and(eq(schema.scormAttempt.activityId, activityId), eq(schema.scormAttempt.profileId, profileId)));

    return rows.length;
  } catch (error) {
    console.error('countScormAttempts error:', error);
    throw new Error(
      `Failed to count SCORM attempts for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createScormAttempt(
  values: TNewScormAttempt,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt> {
  try {
    const [created] = await dbClient.insert(schema.scormAttempt).values(values).returning();
    if (!created) throw new Error('Insert returned no row');

    return created;
  } catch (error) {
    console.error('createScormAttempt error:', error);
    throw new Error(
      `Failed to create SCORM attempt for activity "${values.activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Closes an open attempt with a reason. Touches only open attempts, so a
 * later commit after the rule was met changes nothing. Returns the row, or
 * null when it was already closed.
 */
export async function closeScormAttempt(
  attemptId: string,
  reason: TScormAttemptCloseReason,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt | null> {
  try {
    const closedAt = new Date().toISOString();
    const [closed] = await dbClient
      .update(schema.scormAttempt)
      .set({ closedAt, closeReason: reason })
      .where(and(eq(schema.scormAttempt.id, attemptId), isNull(schema.scormAttempt.closedAt)))
      .returning();

    return closed ?? null;
  } catch (error) {
    console.error('closeScormAttempt error:', error);
    throw new Error(
      `Failed to close SCORM attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
