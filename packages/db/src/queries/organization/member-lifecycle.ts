import * as schema from '@db/schema';

import { sql } from 'drizzle-orm';

import { type DbOrTxClient, db } from '@db/drizzle';

/**
 * Recomputes `organizationmember.last_active_at` from the two signals that
 * define "did something in this org": analytics page events and lesson
 * completions.
 *
 * The ingest path (`insertPageEvents`) keeps the column warm in real time; this
 * repairs whatever it missed — dropped batches, lesson completions, which never
 * flow through page events, and rows written before the column existed.
 *
 * Only moves timestamps forward (`GREATEST` against the current value), so a
 * short `lookbackDays` window can never walk a member's activity backwards, and
 * re-running it is always safe.
 *
 * @param lookbackDays Only consider activity newer than this. The nightly run
 *   uses a small window; pass a large one to repair history.
 * @returns Number of membership rows whose timestamp actually moved.
 */
export async function reconcileMemberLastActive(lookbackDays: number, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const result = await dbClient.execute(sql`
      WITH page_activity AS (
        SELECT ${schema.analyticsPageEvent.orgId} AS org_id,
               ${schema.analyticsPageEvent.userId} AS user_id,
               MAX(${schema.analyticsPageEvent.occurredAt}) AS last_at
        FROM ${schema.analyticsPageEvent}
        WHERE ${schema.analyticsPageEvent.orgId} IS NOT NULL
          AND ${schema.analyticsPageEvent.userId} IS NOT NULL
          AND ${schema.analyticsPageEvent.occurredAt} >= now() - make_interval(days => ${lookbackDays})
        GROUP BY 1, 2
      ),
      lesson_activity AS (
        SELECT g.organization_id AS org_id,
               lc.profile_id AS user_id,
               MAX(lc.updated_at) AS last_at
        FROM lesson_completion lc
        JOIN lesson l ON l.id = lc.lesson_id
        JOIN course c ON c.id = l.course_id
        JOIN "group" g ON g.id = c.group_id
        WHERE lc.profile_id IS NOT NULL
          AND g.organization_id IS NOT NULL
          AND lc.updated_at IS NOT NULL
          AND lc.updated_at >= now() - make_interval(days => ${lookbackDays})
        GROUP BY 1, 2
      ),
      combined AS (
        SELECT org_id, user_id, MAX(last_at) AS last_at
        FROM (SELECT * FROM page_activity UNION ALL SELECT * FROM lesson_activity) signals
        GROUP BY 1, 2
      )
      UPDATE organizationmember om
      SET last_active_at = GREATEST(om.last_active_at, combined.last_at)
      FROM combined
      WHERE om.organization_id = combined.org_id
        AND om.profile_id = combined.user_id
        AND (om.last_active_at IS NULL OR om.last_active_at < combined.last_at)
      RETURNING om.id
    `);

    return result.length;
  } catch (error) {
    console.error('reconcileMemberLastActive error:', error);
    throw new Error('Failed to reconcile member last active timestamps');
  }
}
