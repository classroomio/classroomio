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

/**
 * Closes open attempts for one activity that are pinned to an older version
 * of its package. Returns the number of attempts closed.
 */
export async function closeSupersededAttemptsForActivity(
  activityId: string,
  keepVersionId: string,
  reason: TScormAttemptCloseReason,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const closedAt = new Date().toISOString();
    const closed = await dbClient
      .update(schema.scormAttempt)
      .set({ closedAt, closeReason: reason })
      .where(
        and(
          eq(schema.scormAttempt.activityId, activityId),
          sql`${schema.scormAttempt.packageVersionId} != ${keepVersionId}`,
          isNull(schema.scormAttempt.closedAt)
        )
      )
      .returning({ id: schema.scormAttempt.id });

    return closed.length;
  } catch (error) {
    console.error('closeSupersededAttemptsForActivity error:', error);
    throw new Error(
      `Failed to close superseded attempts for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Closes every open attempt for an activity. Used when the activity is
 * pointed at a different package: those attempts can never resume, so
 * leaving them open would misreport progress forever. Returns the number
 * of attempts closed.
 */
export async function closeOpenAttemptsForActivity(
  activityId: string,
  reason: TScormAttemptCloseReason,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const closedAt = new Date().toISOString();
    const closed = await dbClient
      .update(schema.scormAttempt)
      .set({ closedAt, closeReason: reason })
      .where(and(eq(schema.scormAttempt.activityId, activityId), isNull(schema.scormAttempt.closedAt)))
      .returning({ id: schema.scormAttempt.id });

    return closed.length;
  } catch (error) {
    console.error('closeOpenAttemptsForActivity error:', error);
    throw new Error(
      `Failed to close open attempts for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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

export interface ActivityOpenAttemptCounts {
  inProgress: number;
  stale: number;
  staleVersionNumber: number | null;
  orphaned: number;
}

/**
 * Counts open attempts for an activity. `inProgress` and `stale` cover
 * only the current package: attempts pinned to a previous package
 * (after a swap) restart on next launch whatever the admin chooses, so
 * they are reported separately as `orphaned` for confirm dialogs.
 */
export async function getActivityOpenAttemptCounts(
  activityId: string,
  currentVersionId: string | null,
  currentAssetId: string | null,
  dbClient: DbOrTxClient = db
): Promise<ActivityOpenAttemptCounts> {
  try {
    const open = await dbClient
      .select({
        id: schema.scormAttempt.id,
        packageVersionId: schema.scormAttempt.packageVersionId,
        versionNumber: schema.contentPackageVersion.versionNumber,
        assetId: schema.contentPackageVersion.assetId
      })
      .from(schema.scormAttempt)
      .leftJoin(schema.contentPackageVersion, eq(schema.contentPackageVersion.id, schema.scormAttempt.packageVersionId))
      .where(and(eq(schema.scormAttempt.activityId, activityId), isNull(schema.scormAttempt.closedAt)));

    const sameAssetRows = currentAssetId ? open.filter((row) => row.assetId === currentAssetId) : [];
    const staleRows = currentVersionId ? sameAssetRows.filter((row) => row.packageVersionId !== currentVersionId) : [];
    const staleVersionNumber =
      staleRows.length === 0 ? null : Math.min(...staleRows.map((row) => row.versionNumber ?? Number.MAX_SAFE_INTEGER));

    return {
      inProgress: sameAssetRows.length,
      stale: staleRows.length,
      staleVersionNumber:
        staleVersionNumber === null || staleVersionNumber === Number.MAX_SAFE_INTEGER ? null : staleVersionNumber,
      orphaned: open.length - sameAssetRows.length
    };
  } catch (error) {
    console.error('getActivityOpenAttemptCounts error:', error);
    throw new Error(
      `Failed to count open attempts for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
      .orderBy(
        sql`(${schema.scormAttempt.closedAt} IS NULL) DESC`,
        sql`COALESCE(${schema.scormAttempt.closedAt}, ${schema.scormAttempt.startedAt}) DESC`,
        sql`(${schema.scormAttempt.closeReason} IS DISTINCT FROM 'replaced') DESC`,
        desc(schema.scormAttempt.attemptNumber)
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLatestScormAttempt error:', error);
    throw new Error(
      `Failed to get latest SCORM attempt for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getNextScormAttemptNumber(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const [row] = await dbClient
      .select({
        maxNumber: sql<number>`COALESCE(MAX(${schema.scormAttempt.attemptNumber}), 0)::int`
      })
      .from(schema.scormAttempt)
      .where(and(eq(schema.scormAttempt.activityId, activityId), eq(schema.scormAttempt.profileId, profileId)));

    return (row?.maxNumber ?? 0) + 1;
  } catch (error) {
    console.error('getNextScormAttemptNumber error:', error);
    throw new Error(
      `Failed to get next SCORM attempt number for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists every profile with at least one attempt for an activity. Used to
 * recompute completions when the completion rule changes.
 */
export async function listAttemptProfileIdsByActivity(
  activityId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  try {
    const rows = await dbClient
      .selectDistinct({ profileId: schema.scormAttempt.profileId })
      .from(schema.scormAttempt)
      .where(eq(schema.scormAttempt.activityId, activityId));

    return rows.map((row) => row.profileId);
  } catch (error) {
    console.error('listAttemptProfileIdsByActivity error:', error);
    throw new Error(
      `Failed to list attempt profiles for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
    const wrapped = new Error(
      `Failed to create SCORM attempt for activity "${values.activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    (wrapped as { cause?: unknown }).cause = error;

    throw wrapped;
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

/**
 * Updates an attempt row with specified fields.
 */
export async function updateScormAttempt(
  attemptId: string,
  values: Partial<TScormAttempt>,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt | null> {
  try {
    const [updated] = await dbClient
      .update(schema.scormAttempt)
      .set(values)
      .where(eq(schema.scormAttempt.id, attemptId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateScormAttempt error:', error);
    throw new Error(
      `Failed to update SCORM attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists all attempts for a given activity and learner, ordered with the open
 * attempt first, then by recency and attempt number descending.
 */
export async function listScormAttemptsForProfile(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt[]> {
  try {
    return await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(and(eq(schema.scormAttempt.activityId, activityId), eq(schema.scormAttempt.profileId, profileId)))
      .orderBy(
        sql`(${schema.scormAttempt.closedAt} IS NULL) DESC`,
        sql`(${schema.scormAttempt.closeReason} IS DISTINCT FROM 'replaced') DESC`,
        sql`COALESCE(${schema.scormAttempt.closedAt}, ${schema.scormAttempt.startedAt}) DESC`,
        desc(schema.scormAttempt.attemptNumber)
      );
  } catch (error) {
    console.error('listScormAttemptsForProfile error:', error);
    throw new Error(
      `Failed to list SCORM attempts for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reopens a finished attempt so a learner can continue after settings change.
 */
export async function reopenScormAttempt(
  attemptId: string,
  dbClient: DbOrTxClient = db
): Promise<TScormAttempt | null> {
  try {
    const [finished] = await dbClient
      .select()
      .from(schema.scormAttempt)
      .where(and(eq(schema.scormAttempt.id, attemptId), eq(schema.scormAttempt.closeReason, 'finished')))
      .limit(1);

    if (!finished) return null;

    const [openAttempt] = await dbClient
      .select({ id: schema.scormAttempt.id })
      .from(schema.scormAttempt)
      .where(
        and(
          eq(schema.scormAttempt.activityId, finished.activityId),
          eq(schema.scormAttempt.profileId, finished.profileId),
          isNull(schema.scormAttempt.closedAt)
        )
      )
      .limit(1);

    if (openAttempt) return null;

    const [reopened] = await dbClient
      .update(schema.scormAttempt)
      .set({ closedAt: null, closeReason: null })
      .where(and(eq(schema.scormAttempt.id, attemptId), eq(schema.scormAttempt.closeReason, 'finished')))
      .returning();

    return reopened ?? null;
  } catch (error) {
    console.error('reopenScormAttempt error:', error);
    throw new Error(
      `Failed to reopen SCORM attempt "${attemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reopens the latest superseded ('replaced') attempt on a package version for
 * learners who have no currently open attempt on the activity, have not
 * completed the activity, and whose attempt belongs to the active compliance cycle.
 * Returns the IDs of the reopened attempts.
 */
export async function reopenReplacedAttemptsForVersion(
  packageVersionId: string,
  activityId?: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  try {
    const activityFilter = activityId
      ? sql`AND a.activity_id = ${activityId}::uuid`
      : sql`AND NOT EXISTS (
          SELECT 1
          FROM activity_scorm as_cfg
          JOIN content_package_version cpv ON cpv.id = a.package_version_id
          WHERE as_cfg.activity_id = a.activity_id
            AND as_cfg.asset_id IS DISTINCT FROM cpv.asset_id
        )`;

    const result = await dbClient.execute(sql`
      WITH candidates AS (
        SELECT a.id,
               ROW_NUMBER() OVER (
                 PARTITION BY a.activity_id, a.profile_id
                 ORDER BY COALESCE(a.closed_at, a.started_at) DESC, a.attempt_number DESC
               ) AS rn
        FROM scorm_attempt a
        WHERE a.package_version_id = ${packageVersionId}::uuid
          AND a.close_reason = 'replaced'
          ${activityFilter}
          AND NOT EXISTS (
            SELECT 1
            FROM scorm_attempt oa
            WHERE oa.activity_id = a.activity_id
              AND oa.profile_id = a.profile_id
              AND oa.closed_at IS NULL
          )
          AND NOT EXISTS (
            SELECT 1
            FROM activity_completion ac
            WHERE ac.activity_id = a.activity_id
              AND ac.profile_id = a.profile_id
              AND ac.is_complete IS TRUE
          )
          AND NOT EXISTS (
            SELECT 1
            FROM course_completion_record ccr
            JOIN course_activity ca ON ca.id = a.activity_id
            WHERE ccr.course_id = ca.course_id
              AND ccr.profile_id = a.profile_id
              AND COALESCE(ccr.cycle_number, 1) > 1
              AND ccr.created_at > a.started_at
          )
      )
      UPDATE scorm_attempt
      SET closed_at = NULL, close_reason = NULL
      WHERE id IN (SELECT id FROM candidates WHERE rn = 1)
      RETURNING id`);

    const rows = result as unknown as Array<{ id: string }>;
    return rows.map((r) => String(r.id));
  } catch (error) {
    console.error('reopenReplacedAttemptsForVersion error:', error);
    throw new Error(
      `Failed to reopen replaced attempts for package version "${packageVersionId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
