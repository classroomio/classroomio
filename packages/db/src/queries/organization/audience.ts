import * as schema from '@db/schema';

import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { AUDIENCE_ACTIVITY_WINDOW_DAYS } from '@cio/utils/validation/organization';
import { ROLE } from '@cio/utils/constants';
import { type DbOrTxClient, db } from '@db/drizzle';
import type {
  TAudienceActivityWindow,
  TAudienceCompletion,
  TAudienceEnrollment,
  TAudienceInviteStatus,
  TAudienceMemberStatus,
  TAudienceSortBy,
  TAudienceSortOrder
} from '@cio/utils/validation/organization';

export type GetOrganizationAudienceOptions = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: TAudienceSortBy;
  sortOrder?: TAudienceSortOrder;
  status?: TAudienceMemberStatus;
  inviteStatus?: TAudienceInviteStatus;
  enrollment?: TAudienceEnrollment;
  completion?: TAudienceCompletion;
  lastLoginBefore?: TAudienceActivityWindow;
  lastActiveBefore?: TAudienceActivityWindow;
  excludeRecentJoiners?: boolean;
  /** Restrict to these members, bypassing every other filter including the default status. */
  memberIds?: number[];
};

// Login events, not `session.updated_at`, which is pruned on expiry and so
// cannot answer "never logged in".
const lastLoginAtSql = sql<string | null>`(
  SELECT MAX(le.logged_in_at)
  FROM analytics_login_events le
  WHERE le.user_id = ${schema.profile.id}
)`;

/**
 * Per-learner enrolment and progress across this org's courses.
 *
 * A course's work is its lessons **and** its exercises, matching
 * `calcCourseProgress` in the dashboard — the definition the course card and
 * LMS dashboard already show. Counting lessons alone reported a learner who
 * had watched everything and submitted nothing as 100% complete.
 *
 * Not `course_completion_record`, which only exists for compliance courses.
 * The `total_items > 0` guard stops an empty course counting as completed.
 *
 * An exercise belongs to a course directly or through its lesson, and a
 * submission is keyed by `groupmember`, not profile.
 *
 * `leftJoinLateral` emits the LATERAL keyword, so this is the subquery only.
 */
const enrolmentSummaryLateral = (orgId: string): SQL => sql`(
  SELECT
    COUNT(*)::int AS enrolled_count,
    COUNT(*) FILTER (
      WHERE course_stats.total_items > 0
        AND course_stats.completed_items = course_stats.total_items
    )::int AS completed_count,
    COUNT(*) FILTER (
      WHERE course_stats.completed_items > 0
        AND (course_stats.total_items = 0 OR course_stats.completed_items < course_stats.total_items)
    )::int AS in_progress_count,
    COALESCE(SUM(course_stats.completed_items), 0)::int AS completed_items,
    COALESCE(SUM(course_stats.total_items), 0)::int AS total_items
  FROM (
    SELECT
      (SELECT COUNT(*) FROM lesson l WHERE l.course_id = c.id)
        + (
          SELECT COUNT(*)
          FROM exercise e
          LEFT JOIN lesson el ON el.id = e.lesson_id
          WHERE e.course_id = c.id OR el.course_id = c.id
        ) AS total_items,
      (
        SELECT COUNT(*)
        FROM lesson l
        JOIN lesson_completion lc
          ON lc.lesson_id = l.id
         AND lc.profile_id = ${schema.profile.id}
         AND lc.is_complete = true
        WHERE l.course_id = c.id
      )
        + (
          SELECT COUNT(DISTINCT s.exercise_id)
          FROM submission s
          JOIN exercise e ON e.id = s.exercise_id
          LEFT JOIN lesson el ON el.id = e.lesson_id
          WHERE (e.course_id = c.id OR el.course_id = c.id)
            AND s.submitted_by = gm.id
        ) AS completed_items
    FROM groupmember gm
    JOIN "group" g ON g.id = gm.group_id AND g.organization_id = ${orgId}
    JOIN course c ON c.group_id = g.id
    WHERE gm.profile_id = ${schema.profile.id}
  ) course_stats
) enrolment`;

const enrolledCountSql = sql<number>`COALESCE(enrolment.enrolled_count, 0)`;
const completedCountSql = sql<number>`COALESCE(enrolment.completed_count, 0)`;
const inProgressCountSql = sql<number>`COALESCE(enrolment.in_progress_count, 0)`;
const completedItemsSql = sql<number>`COALESCE(enrolment.completed_items, 0)`;
const totalItemsSql = sql<number>`COALESCE(enrolment.total_items, 0)`;

/**
 * Mirrors `deriveAudienceMemberStatus` so invite status can be filtered before
 * `LIMIT`. That function still owns the value returned to clients — keep both
 * in step.
 */
const inviteStatusSql = sql<string>`(
  CASE
    WHEN ${schema.organizationmember.profileId} IS NOT NULL THEN 'active'
    ELSE COALESCE((
      SELECT CASE
               WHEN oi.accepted_at IS NOT NULL THEN 'active'
               WHEN oi.is_revoked THEN 'revoked'
               WHEN oi.expires_at <= now() THEN 'expired'
               ELSE 'pending'
             END
      FROM organization_invite oi
      WHERE oi.organization_id = ${schema.organizationmember.organizationId}
        AND lower(oi.email) = lower(${schema.organizationmember.email})
      ORDER BY oi.created_at DESC
      LIMIT 1
    ), 'pending')
  END
)`;

/** Grace period before a newly invited learner can be judged dormant. */
const RECENT_JOINER_GRACE_DAYS = 7;

/**
 * "Older than the window, or absent entirely". `never` matches only absence.
 * `excludeRecentJoiners` drops learners too new to be judged dormant.
 */
function stalenessCondition(
  activitySql: SQL<string | null>,
  window: TAudienceActivityWindow,
  joinedAtSql: SQL<string>,
  excludeRecentJoiners: boolean
): SQL {
  if (window === 'never') {
    const neverActive = sql`${activitySql} IS NULL`;

    if (!excludeRecentJoiners) {
      return neverActive;
    }

    return sql`(${neverActive} AND ${joinedAtSql} < now() - make_interval(days => ${RECENT_JOINER_GRACE_DAYS}))`;
  }

  const days = AUDIENCE_ACTIVITY_WINDOW_DAYS[window];
  const cutoff = sql`now() - make_interval(days => ${days})`;
  const stale = sql`(${activitySql} IS NULL OR ${activitySql} < ${cutoff})`;

  return excludeRecentJoiners ? sql`(${stale} AND ${joinedAtSql} < ${cutoff})` : stale;
}

/**
 * Folds per-course states into one exclusive learner state, by precedence so
 * the buckets partition the enrolled population. Learners with no enrolment
 * match none of them — only `enrollment=not_enrolled` finds those.
 */
function completionCondition(completion: TAudienceCompletion): SQL {
  if (completion === 'not_started') {
    return sql`(${enrolledCountSql} > 0 AND ${completedCountSql} = 0 AND ${inProgressCountSql} = 0)`;
  }

  if (completion === 'completed') {
    return sql`(${enrolledCountSql} > 0 AND ${completedCountSql} = ${enrolledCountSql})`;
  }

  return sql`(
    ${enrolledCountSql} > 0
    AND NOT (${completedCountSql} = 0 AND ${inProgressCountSql} = 0)
    AND ${completedCountSql} <> ${enrolledCountSql}
  )`;
}

/**
 * Same shape as a `getOrganizationAudience` row, so the detail view and list
 * agree. Not status-filtered — a link to an archived learner should still work.
 */
export const getOrganizationAudienceMember = async (orgId: string, memberId: number) => {
  const audienceEmailSql = sql<string>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`;

  const [row] = await db
    .select({
      memberId: schema.organizationmember.id,
      profileId: schema.organizationmember.profileId,
      fullname: schema.profile.fullname,
      email: audienceEmailSql.as('email'),
      avatarUrl: schema.profile.avatarUrl,
      memberCreatedAt: schema.organizationmember.createdAt,
      memberStatus: schema.organizationmember.status,
      lastActiveAt: schema.organizationmember.lastActiveAt,
      lastLoginAt: lastLoginAtSql.as('lastLoginAt'),
      enrolledCount: enrolledCountSql.as('enrolledCount'),
      completedCount: completedCountSql.as('completedCount'),
      completedItems: completedItemsSql.as('completedItems'),
      totalItems: totalItemsSql.as('totalItems')
    })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .leftJoinLateral(enrolmentSummaryLateral(orgId), sql`true`)
    .where(
      and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.id, memberId),
        eq(schema.organizationmember.roleId, ROLE.STUDENT)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const email = row.email?.trim() ?? '';
  const name = row.fullname?.trim() || (email.includes('@') ? email.split('@')[0] : email) || '';
  // When they joined this org, not when their account was created. The
  // dormancy filters key off the same column, so a displayed account age would
  // contradict them.
  const createdAt = row.memberCreatedAt ? new Date(row.memberCreatedAt).toDateString() : '';
  const totalItems = Number(row.totalItems ?? 0);
  const completedItems = Number(row.completedItems ?? 0);

  return {
    id: row.memberId,
    profileId: row.profileId ?? null,
    name,
    email,
    avatarUrl: row.avatarUrl || '',
    createdAt,
    memberStatus: row.memberStatus,
    lastLoginAt: row.lastLoginAt ?? null,
    lastActiveAt: row.lastActiveAt ?? null,
    enrolledCount: Number(row.enrolledCount ?? 0),
    completedCount: Number(row.completedCount ?? 0),
    progressPercent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  };
};

/**
 * The single source of truth for "which learners match these filters" — the
 * list, the count and bulk-action target resolution all go through it, which is
 * what stops a filter-mode action targeting a different set than was shown.
 *
 * `needsEnrolmentJoin` says whether the clause references the enrolment
 * lateral, so callers that do not need it can skip the join.
 */
export function buildAudienceWhereClause(
  orgId: string,
  options: GetOrganizationAudienceOptions = {}
): { whereClause: SQL; needsEnrolmentJoin: boolean } {
  const search = options.search?.trim();
  const status = options.status ?? 'ACTIVE';
  const excludeRecentJoiners = options.excludeRecentJoiners ?? true;

  // Org join date, not account age — an old account invited last week is new here.
  const joinedOrgAtSql = sql<string>`${schema.organizationmember.createdAt}`;
  const lastActiveAtSql = sql<string | null>`${schema.organizationmember.lastActiveAt}`;

  // An id selection is the whole predicate: no filter may drop a named row.
  if (options.memberIds?.length) {
    return {
      whereClause: and(
        eq(schema.organizationmember.organizationId, orgId),
        eq(schema.organizationmember.roleId, ROLE.STUDENT),
        inArray(schema.organizationmember.id, options.memberIds)
      )!,
      needsEnrolmentJoin: false
    };
  }

  const conditions: SQL[] = [
    eq(schema.organizationmember.organizationId, orgId),
    eq(schema.organizationmember.roleId, ROLE.STUDENT),
    eq(schema.organizationmember.status, status)
  ];

  if (search) {
    const searchValue = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.profile.fullname, searchValue),
        ilike(schema.profile.email, searchValue),
        ilike(schema.organizationmember.email, searchValue)
      )!
    );
  }

  if (options.inviteStatus) {
    conditions.push(sql`${inviteStatusSql} = ${options.inviteStatus}`);
  }

  if (options.enrollment) {
    conditions.push(options.enrollment === 'enrolled' ? sql`${enrolledCountSql} > 0` : sql`${enrolledCountSql} = 0`);
  }

  if (options.completion) {
    conditions.push(completionCondition(options.completion));
  }

  if (options.lastLoginBefore) {
    conditions.push(stalenessCondition(lastLoginAtSql, options.lastLoginBefore, joinedOrgAtSql, excludeRecentJoiners));
  }

  if (options.lastActiveBefore) {
    conditions.push(
      stalenessCondition(lastActiveAtSql, options.lastActiveBefore, joinedOrgAtSql, excludeRecentJoiners)
    );
  }

  return {
    whereClause: and(...conditions)!,
    needsEnrolmentJoin: Boolean(options.enrollment || options.completion)
  };
}

/**
 * Non-archived count for the delete gate. Derived from the filter, not from an
 * id list, which would build an unbounded `IN` predicate.
 */
export async function countAudienceMatchesNotArchived(
  orgId: string,
  options: GetOrganizationAudienceOptions = {},
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const { whereClause, needsEnrolmentJoin } = buildAudienceWhereClause(orgId, options);

    const query = dbClient
      .select({ count: count(schema.organizationmember.id) })
      .from(schema.organizationmember)
      .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .$dynamic();

    if (needsEnrolmentJoin) {
      query.leftJoinLateral(enrolmentSummaryLateral(orgId), sql`true`);
    }

    const [row] = await query.where(and(whereClause, ne(schema.organizationmember.status, 'ARCHIVED')));

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countAudienceMatchesNotArchived error:', error);
    throw new Error('Failed to count non-archived audience matches');
  }
}

/**
 * A few learners from the matched set, for a confirmation dialog's sample.
 * Bounded by `LIMIT` against the filter, never by slicing a materialized list.
 */
export async function getAudienceMatchSample(
  orgId: string,
  options: GetOrganizationAudienceOptions = {},
  sampleSize: number,
  dbClient: DbOrTxClient = db
): Promise<{ id: number; email: string | null }[]> {
  try {
    const { whereClause, needsEnrolmentJoin } = buildAudienceWhereClause(orgId, options);

    const query = dbClient
      .select({
        id: schema.organizationmember.id,
        email: sql<string | null>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`.as('email')
      })
      .from(schema.organizationmember)
      .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .$dynamic();

    if (needsEnrolmentJoin) {
      query.leftJoinLateral(enrolmentSummaryLateral(orgId), sql`true`);
    }

    return await query.where(whereClause).orderBy(asc(schema.organizationmember.id)).limit(sampleSize);
  } catch (error) {
    console.error('getAudienceMatchSample error:', error);
    throw new Error('Failed to sample audience matches');
  }
}

/**
 * Every matching member id, ordered so the result is stable. Feeds filter-mode
 * target resolution and the preview's target hash. Uncapped by design.
 */
export async function resolveAudienceMemberIds(
  orgId: string,
  options: GetOrganizationAudienceOptions = {},
  dbClient: DbOrTxClient = db
): Promise<number[]> {
  try {
    const { whereClause, needsEnrolmentJoin } = buildAudienceWhereClause(orgId, options);

    const query = dbClient
      .select({ id: schema.organizationmember.id })
      .from(schema.organizationmember)
      .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .$dynamic();

    if (needsEnrolmentJoin) {
      query.leftJoinLateral(enrolmentSummaryLateral(orgId), sql`true`);
    }

    const rows = await query.where(whereClause).orderBy(asc(schema.organizationmember.id));

    return rows.map((row) => row.id);
  } catch (error) {
    console.error('resolveAudienceMemberIds error:', error);
    throw new Error('Failed to resolve audience members for the given filters');
  }
}

export const getOrganizationAudience = async (orgId: string, options: GetOrganizationAudienceOptions = {}) => {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder = options.sortOrder ?? 'desc';

  const audienceNameSql = sql<string>`COALESCE(NULLIF(${schema.profile.fullname}, ''), ${schema.profile.email}, ${schema.organizationmember.email})`;
  const audienceEmailSql = sql<string>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`;
  const audienceCreatedAtSql = sql<string>`COALESCE(${schema.profile.createdAt}, ${schema.organizationmember.createdAt})`;
  const lastActiveAtSql = sql<string | null>`${schema.organizationmember.lastActiveAt}`;
  const enrolmentLateral = enrolmentSummaryLateral(orgId);

  // Only these filters make the count need the expensive lateral.
  const { whereClause, needsEnrolmentJoin: countNeedsEnrolment } = buildAudienceWhereClause(orgId, options);

  const countQuery = db
    .select({ count: count(schema.organizationmember.id) })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .$dynamic();

  if (countNeedsEnrolment) {
    countQuery.leftJoinLateral(enrolmentLateral, sql`true`);
  }

  const [totalRow] = await countQuery.where(whereClause);
  const total = Number(totalRow?.count ?? 0);

  const orderByExpression =
    sortBy === 'name'
      ? audienceNameSql
      : sortBy === 'email'
        ? audienceEmailSql
        : sortBy === 'lastLoginAt'
          ? lastLoginAtSql
          : sortBy === 'lastActiveAt'
            ? lastActiveAtSql
            : audienceCreatedAtSql;

  // Nulls first: no activity is the stalest, not the least stale.
  const sortsOnActivity = sortBy === 'lastLoginAt' || sortBy === 'lastActiveAt';
  const orderedExpression = sortOrder === 'asc' ? asc(orderByExpression) : desc(orderByExpression);
  const orderBy = sortsOnActivity
    ? [sql`${orderByExpression} IS NOT NULL`, orderedExpression, desc(schema.organizationmember.id)]
    : [orderedExpression, desc(schema.organizationmember.id)];

  const result = await db
    .select({
      memberId: schema.organizationmember.id,
      profileId: schema.profile.id,
      fullname: schema.profile.fullname,
      email: audienceEmailSql.as('email'),
      avatarUrl: schema.profile.avatarUrl,
      memberCreatedAt: schema.organizationmember.createdAt,
      memberStatus: schema.organizationmember.status,
      lastActiveAt: schema.organizationmember.lastActiveAt,
      lastLoginAt: lastLoginAtSql.as('lastLoginAt'),
      enrolledCount: enrolledCountSql.as('enrolledCount'),
      completedCount: completedCountSql.as('completedCount'),
      completedItems: completedItemsSql.as('completedItems'),
      totalItems: totalItemsSql.as('totalItems')
    })
    .from(schema.organizationmember)
    .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
    .leftJoinLateral(enrolmentLateral, sql`true`)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  return {
    items: result.map((row) => {
      const email = row.email?.trim() ?? '';
      const name = row.fullname?.trim() || (email.includes('@') ? email.split('@')[0] : email) || '';
      const createdAt = row.memberCreatedAt ? new Date(row.memberCreatedAt).toDateString() : '';
      const totalItems = Number(row.totalItems ?? 0);
      const completedItems = Number(row.completedItems ?? 0);
      const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        id: row.memberId,
        profileId: row.profileId ?? null,
        name,
        email,
        avatarUrl: row.avatarUrl || '',
        createdAt,
        memberStatus: row.memberStatus,
        lastLoginAt: row.lastLoginAt ?? null,
        lastActiveAt: row.lastActiveAt ?? null,
        enrolledCount: Number(row.enrolledCount ?? 0),
        completedCount: Number(row.completedCount ?? 0),
        progressPercent
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};
