import { and, count, eq, isNull, ne, sql, type SQL } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import * as schema from '../../schema';
import type { TCourseEnrollmentGrant, TNewCourseEnrollmentGrant } from '../../types';
import { ROLE } from '@cio/utils/constants';
import { normalizeBackfillOrgId } from '../backfill';

/**
 * Course enrollment provenance ledger.
 *
 * Learner access is `groupmember` **plus** a live grant: every enrollment
 * writer records *why* (`SELF_ENROLL`, `INVITE`, `ADMIN_ADD`,
 * `ORG_AUDIENCE`, `COHORT`, `LEARNING_PATH`, `PROGRAM`, `IMPORT`), removals
 * revoke, and re-adds reactivate. Team access (tutors, org admins) is
 * role-based and intentionally grant-less — grants model learner access only.
 */

/**
 * Grants access to a course and records its provenance.
 * Idempotent via unique constraint on (groupmemberId, courseId, source, cohortId, learningPathId);
 * an existing revoked grant is reactivated so re-adding a member restores their course access.
 */
export async function grantCourseAccess(
  data: TNewCourseEnrollmentGrant,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant> {
  try {
    const [granted] = await dbClient
      .insert(schema.courseEnrollmentGrant)
      .values(data)
      .onConflictDoUpdate({
        target: [
          schema.courseEnrollmentGrant.groupmemberId,
          schema.courseEnrollmentGrant.courseId,
          schema.courseEnrollmentGrant.source,
          schema.courseEnrollmentGrant.cohortId,
          schema.courseEnrollmentGrant.learningPathId
        ],
        set: {
          revokedAt: null,
          grantedAt: sql`now()`,
          grantedByProfileId: sql`EXCLUDED.granted_by_profile_id`
        }
      })
      .returning();

    if (!granted) {
      throw new Error('Failed to record course enrollment grant');
    }

    return granted;
  } catch (error) {
    console.error('grantCourseAccess error:', error);
    throw new Error(`Failed to grant course access: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Shared revoke helper for the grant ledger. All revoke paths set `revokedAt`
 * on active rows matching the caller-supplied predicate.
 */
async function revokeActiveGrants(where: SQL | undefined, dbClient: DbOrTxClient): Promise<void> {
  if (!where) {
    return;
  }

  const nowIso = new Date().toISOString();

  await dbClient
    .update(schema.courseEnrollmentGrant)
    .set({ revokedAt: nowIso })
    .where(and(where, isNull(schema.courseEnrollmentGrant.revokedAt)));
}

/**
 * Revokes every active grant for one groupmember row, regardless of source.
 * Deleting a membership cascades to its grants via ON DELETE CASCADE, so this
 * is defensive only for soft removals (role changes away from STUDENT) where
 * the row survives. Call it BEFORE the delete when the row is being removed.
 */
export async function revokeGrantsForGroupmember(groupmemberId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await revokeActiveGrants(eq(schema.courseEnrollmentGrant.groupmemberId, groupmemberId), dbClient);
  } catch (error) {
    console.error('revokeGrantsForGroupmember error:', error);
    throw new Error(
      `Failed to revoke grants for groupmember "${groupmemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Revokes all active learning path grants for a student in a specific path.
 */
export async function revokeLearningPathGrants(
  learningPathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await revokeActiveGrants(
      and(
        eq(schema.courseEnrollmentGrant.learningPathId, learningPathId),
        eq(schema.courseEnrollmentGrant.profileId, profileId)
      ),
      dbClient
    );
  } catch (error) {
    console.error('revokeLearningPathGrants error:', error);
    throw new Error(
      `Failed to revoke learning path grants for path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Revokes all active learning path grants for every learner in a path.
 * Called on path deletion: the container is gone so no grant derived from it
 * may stay live, while groupmember rows and progress are preserved (same
 * doctrine as member removal, applied path-wide).
 */
export async function revokeLearningPathGrantsForPath(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await revokeActiveGrants(
      and(
        eq(schema.courseEnrollmentGrant.learningPathId, learningPathId),
        eq(schema.courseEnrollmentGrant.source, 'LEARNING_PATH')
      ),
      dbClient
    );
  } catch (error) {
    console.error('revokeLearningPathGrantsForPath error:', error);
    throw new Error(
      `Failed to revoke learning path grants for path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Revokes all active cohort grants for a student in a specific cohort.
 * Called on cohort removal so the People source badge and permission checks
 * stop reporting cohort access the learner no longer has.
 */
export async function revokeCohortGrants(
  cohortId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await revokeActiveGrants(
      and(eq(schema.courseEnrollmentGrant.cohortId, cohortId), eq(schema.courseEnrollmentGrant.profileId, profileId)),
      dbClient
    );
  } catch (error) {
    console.error('revokeCohortGrants error:', error);
    throw new Error(
      `Failed to revoke cohort grants for cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the count of active (non-revoked) grants for a given groupmember row.
 */
export async function getActiveGrantCount(groupmemberId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [countRow] = await dbClient
      .select({ count: count(schema.courseEnrollmentGrant.id) })
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.groupmemberId, groupmemberId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      );

    return Number(countRow?.count ?? 0);
  } catch (error) {
    console.error('getActiveGrantCount error:', error);
    throw new Error(
      `Failed to get active grant count for groupmember "${groupmemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists all grants for a given groupmember row.
 */
export async function getGrantsForMember(
  groupmemberId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseEnrollmentGrant)
      .where(eq(schema.courseEnrollmentGrant.groupmemberId, groupmemberId));
  } catch (error) {
    console.error('getGrantsForMember error:', error);
    throw new Error(
      `Failed to get grants for groupmember "${groupmemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists active grants for a profile in a course.
 */
export async function getActiveGrantsForCourseAndProfile(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.courseId, courseId),
          eq(schema.courseEnrollmentGrant.profileId, profileId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      );
  } catch (error) {
    console.error('getActiveGrantsForCourseAndProfile error:', error);
    throw new Error(
      `Failed to get active grants for course "${courseId}" and profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Whether the user holds any unrevoked enrollment grant for the course.
 * General learner-access check; prefer it over groupmember-row reads.
 */
export async function hasLiveCourseGrant(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.courseEnrollmentGrant.id })
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.courseId, courseId),
          eq(schema.courseEnrollmentGrant.profileId, profileId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      )
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('hasLiveCourseGrant error:', error);
    throw new Error(
      `Failed to check live grants for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Whether the user holds the course independently of any learning path: a
 * live grant whose source is not `LEARNING_PATH`. Path-sequential locking,
 * My Learning course cards, and path redirects all key off this — never off
 * the mere absence of a path grant.
 */
export async function hasLiveNonPathGrant(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.courseEnrollmentGrant.id })
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.courseId, courseId),
          eq(schema.courseEnrollmentGrant.profileId, profileId),
          ne(schema.courseEnrollmentGrant.source, 'LEARNING_PATH'),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      )
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('hasLiveNonPathGrant error:', error);
    throw new Error(
      `Failed to check non-path grants for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Active `LEARNING_PATH` grants for a profile in a course, with the owning
 * path's public id for learner-facing redirects. Only paths that are still
 * active are returned.
 */
export async function getActivePathGrantsForCourseAndProfile(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<Array<{ learningPathId: string; publicId: string | null }>> {
  try {
    const rows = await dbClient
      .select({
        learningPathId: schema.courseEnrollmentGrant.learningPathId,
        publicId: schema.learningPath.publicId
      })
      .from(schema.courseEnrollmentGrant)
      .innerJoin(schema.learningPath, eq(schema.learningPath.id, schema.courseEnrollmentGrant.learningPathId))
      .where(
        and(
          eq(schema.courseEnrollmentGrant.courseId, courseId),
          eq(schema.courseEnrollmentGrant.profileId, profileId),
          eq(schema.courseEnrollmentGrant.source, 'LEARNING_PATH'),
          isNull(schema.courseEnrollmentGrant.revokedAt),
          eq(schema.learningPath.status, 'ACTIVE')
        )
      );

    return rows
      .filter((row): row is (typeof rows)[number] & { learningPathId: string } => row.learningPathId !== null)
      .map((row) => ({ learningPathId: row.learningPathId, publicId: row.publicId }));
  } catch (error) {
    console.error('getActivePathGrantsForCourseAndProfile error:', error);
    throw new Error(
      `Failed to get path grants for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Normalizes a driver result to rows: postgres-js returns an array, node-postgres `{ rows }`. */
function toRowArray(completed: unknown): unknown[] {
  if (Array.isArray(completed)) {
    return completed;
  }

  const rows = (completed as { rows?: unknown }).rows;

  return Array.isArray(rows) ? rows : [];
}

/** Row count of an `INSERT … RETURNING id` result, either driver shape. */
function extractInsertedRowCount(completed: unknown): number {
  return toRowArray(completed).length;
}

/** Reads the `total` of a `count(*)` result (number or numeric string), either driver shape. */
function extractTotalCount(completed: unknown): number {
  const rows = toRowArray(completed) as Array<{ total?: unknown }>;
  const total = rows[0]?.total;

  return typeof total === 'number' ? total : Number(total ?? 0);
}

/**
 * One-time backfill for the `course_enrollment_grant` rollout.
 *
 * Existing course enrollments only have `groupmember` rows, so any check
 * requiring a grant would fail for them. Inserts one `IMPORT` grant per
 * STUDENT groupmember row that has none. Staff (tutor/admin) access is
 * role-based and intentionally grant-less. Idempotent by construction (the
 * anti-join skips rows that already have a grant), so re-running is always safe.
 *
 * Intended to run inside the merge-time migration (or via
 * `pnpm db:backfill-course-enrollment-grants`), not on any hot path.
 * Returns the number of grants inserted.
 */
export async function backfillMissingCourseEnrollmentGrants(
  options?: { organizationId?: string },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const organizationId = normalizeBackfillOrgId(options?.organizationId);
    const groupJoin = organizationId ? sql`JOIN "group" g ON g.id = gm.group_id` : sql``;
    const orgFilter = organizationId ? sql`AND g.organization_id = ${organizationId}` : sql``;

    const completed = await dbClient.execute(sql`
      INSERT INTO course_enrollment_grant (groupmember_id, course_id, profile_id, source, granted_at)
      SELECT gm.id, c.id, gm.profile_id, 'IMPORT', now()
      FROM groupmember gm
      JOIN course c ON c.group_id = gm.group_id
      ${groupJoin}
      LEFT JOIN course_enrollment_grant ceg ON ceg.groupmember_id = gm.id
      WHERE ceg.id IS NULL
        AND gm.role_id = ${ROLE.STUDENT}
      ${orgFilter}
      RETURNING id
    `);

    return extractInsertedRowCount(completed);
  } catch (error) {
    console.error('backfillMissingCourseEnrollmentGrants error:', error);
    throw new Error(
      `Failed to backfill course enrollment grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Counts STUDENT groupmember rows that still lack any enrollment grant.
 * Used for dry runs before {@link backfillMissingCourseEnrollmentGrants}.
 */
export async function countMissingCourseEnrollmentGrants(
  options?: { organizationId?: string },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const organizationId = normalizeBackfillOrgId(options?.organizationId);
    const groupJoin = organizationId ? sql`JOIN "group" g ON g.id = gm.group_id` : sql``;
    const orgFilter = organizationId ? sql`AND g.organization_id = ${organizationId}` : sql``;

    const completed = await dbClient.execute(sql`
      SELECT count(*)::int AS total
      FROM groupmember gm
      JOIN course c ON c.group_id = gm.group_id
      ${groupJoin}
      LEFT JOIN course_enrollment_grant ceg ON ceg.groupmember_id = gm.id
      WHERE ceg.id IS NULL
        AND gm.role_id = ${ROLE.STUDENT}
      ${orgFilter}
    `);

    return extractTotalCount(completed);
  } catch (error) {
    console.error('countMissingCourseEnrollmentGrants error:', error);
    throw new Error(
      `Failed to count missing course enrollment grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Records provenance for many memberships in a single statement.
 * Only covers memberships that exist (inner join), so it both grants new
 * rows and repairs pre-ledger ones. Duplicate-safe via the source unique
 * constraint, which treats NULL cohort/path ids as colliding.
 */
export async function bulkInsertDirectCourseGrants(
  input: {
    groupIds: string[];
    profileIds: string[];
    courseIds: string[];
    source: TCourseEnrollmentGrant['source'];
    cohortId?: string;
    learningPathId?: string;
    grantedByProfileId?: string;
  },
  dbClient: DbOrTxClient = db
): Promise<number> {
  if (input.groupIds.length === 0 || input.profileIds.length === 0 || input.courseIds.length === 0) {
    return 0;
  }

  try {
    // NOTE: arrays must go through `sql.param`. A bare `${array}` inside
    // drizzle's `sql` tag is spread into separate scalar params
    // (`ANY(($5))` with a scalar), which Postgres rejects with
    // `malformed array literal`. `sql.param` keeps each list as one array
    // bind, and the `::uuid[]` casts pin the type for `ANY()`.
    const completed = await dbClient.execute(sql`
      INSERT INTO course_enrollment_grant (groupmember_id, course_id, profile_id, source, cohort_id, learning_path_id, granted_by_profile_id, granted_at)
      SELECT gm.id, c.id, gm.profile_id, ${input.source}, ${input.cohortId ?? null}, ${input.learningPathId ?? null}, ${input.grantedByProfileId ?? null}, now()
      FROM groupmember gm
      JOIN course c ON c.group_id = gm.group_id
      WHERE gm.group_id = ANY(${sql.param(input.groupIds)}::uuid[])
        AND gm.profile_id = ANY(${sql.param(input.profileIds)}::uuid[])
        AND c.id = ANY(${sql.param(input.courseIds)}::uuid[])
        AND gm.role_id = ${ROLE.STUDENT}
      ON CONFLICT (groupmember_id, course_id, source, cohort_id, learning_path_id) DO NOTHING
      RETURNING id
    `);

    return extractInsertedRowCount(completed);
  } catch (error) {
    console.error('bulkInsertDirectCourseGrants error:', error);
    throw new Error(
      `Failed to record direct course grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Derives `COHORT` grants for cohort-driven enrollments that predate the
 * grant ledger, from cohort membership crossed with cohort courses. Only
 * STUDENT groupmember rows are backfilled; staff access is role-based.
 *
 * Run BEFORE the generic `IMPORT` backfill so cohort history keeps its true
 * source instead of being masked as an import. Idempotent by construction.
 * Returns the number of grants inserted.
 */
export async function backfillCohortCourseEnrollmentGrants(
  options?: { organizationId?: string },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const organizationId = normalizeBackfillOrgId(options?.organizationId);
    const orgFilter = organizationId ? sql`AND co.organization_id = ${organizationId}` : sql``;

    const completed = await dbClient.execute(sql`
      INSERT INTO course_enrollment_grant (groupmember_id, course_id, profile_id, source, cohort_id, granted_at)
      SELECT gm.id, c.id, cm.profile_id, 'COHORT', cm.cohort_id, now()
      FROM cohort_member cm
      INNER JOIN cohort co ON co.id = cm.cohort_id
      INNER JOIN cohort_course cc ON cc.cohort_id = co.id
      INNER JOIN course c ON c.id = cc.course_id
      INNER JOIN groupmember gm ON gm.group_id = c.group_id AND gm.profile_id = cm.profile_id
      LEFT JOIN course_enrollment_grant ceg ON ceg.groupmember_id = gm.id
      WHERE cm.profile_id IS NOT NULL
        AND gm.role_id = ${ROLE.STUDENT}
        AND ceg.id IS NULL
      ${orgFilter}
      RETURNING id
    `);

    return extractInsertedRowCount(completed);
  } catch (error) {
    console.error('backfillCohortCourseEnrollmentGrants error:', error);
    throw new Error(
      `Failed to backfill cohort course enrollment grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Counts cohort-driven STUDENT enrollments still missing a grant.
 * Used for dry runs before {@link backfillCohortCourseEnrollmentGrants}.
 */
export async function countMissingCohortCourseEnrollmentGrants(
  options?: { organizationId?: string },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const organizationId = normalizeBackfillOrgId(options?.organizationId);
    const orgFilter = organizationId ? sql`AND co.organization_id = ${organizationId}` : sql``;

    const completed = await dbClient.execute(sql`
      SELECT count(*)::int AS total
      FROM cohort_member cm
      INNER JOIN cohort co ON co.id = cm.cohort_id
      INNER JOIN cohort_course cc ON cc.cohort_id = co.id
      INNER JOIN course c ON c.id = cc.course_id
      INNER JOIN groupmember gm ON gm.group_id = c.group_id AND gm.profile_id = cm.profile_id
      LEFT JOIN course_enrollment_grant ceg ON ceg.groupmember_id = gm.id
      WHERE cm.profile_id IS NOT NULL
        AND gm.role_id = ${ROLE.STUDENT}
        AND ceg.id IS NULL
      ${orgFilter}
    `);

    return extractTotalCount(completed);
  } catch (error) {
    console.error('countMissingCohortCourseEnrollmentGrants error:', error);
    throw new Error(
      `Failed to count missing cohort course enrollment grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
