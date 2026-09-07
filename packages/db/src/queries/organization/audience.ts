import * as schema from '@db/schema';

import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { AUDIENCE_ACTIVITY_WINDOW_DAYS } from '@cio/utils/validation/organization';
import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';
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
};

/**
 * Last login for the row's profile. Login events are the durable source:
 * `session.updated_at` is pruned on expiry, so it cannot answer "never logged
 * in". Backed by `idx_analytics_login_events_user_logged_in`.
 */
const lastLoginAtSql = sql<string | null>`(
  SELECT MAX(le.logged_in_at)
  FROM analytics_login_events le
  WHERE le.user_id = ${schema.profile.id}
)`;

/**
 * Per-learner enrolment and progress across this organization's courses only,
 * joined LATERAL so it is evaluated once per row rather than once per column
 * that reads it.
 *
 * Course completion is measured in completed lessons rather than
 * `course_completion_record`, which exists only for compliance-tracked courses
 * and would read as "not started" for everyone else.
 *
 * A course with no lessons can never be `completed` (the `total_lessons > 0`
 * guard). Without it, "every lesson completed" is vacuously true for an empty
 * course and an untouched learner would report as finished.
 */
// `leftJoinLateral` emits the LATERAL keyword itself, so this fragment is the
// subquery and its alias only.
const enrolmentSummaryLateral = (orgId: string): SQL => sql`(
  SELECT
    COUNT(*)::int AS enrolled_count,
    COUNT(*) FILTER (
      WHERE course_stats.total_lessons > 0
        AND course_stats.completed_lessons = course_stats.total_lessons
    )::int AS completed_count,
    COUNT(*) FILTER (
      WHERE course_stats.completed_lessons > 0
        AND (course_stats.total_lessons = 0 OR course_stats.completed_lessons < course_stats.total_lessons)
    )::int AS in_progress_count,
    COALESCE(SUM(course_stats.completed_lessons), 0)::int AS completed_lessons,
    COALESCE(SUM(course_stats.total_lessons), 0)::int AS total_lessons
  FROM (
    SELECT
      (SELECT COUNT(*) FROM lesson l WHERE l.course_id = c.id) AS total_lessons,
      (
        SELECT COUNT(*)
        FROM lesson l
        JOIN lesson_completion lc
          ON lc.lesson_id = l.id
         AND lc.profile_id = ${schema.profile.id}
         AND lc.is_complete = true
        WHERE l.course_id = c.id
      ) AS completed_lessons
    FROM groupmember gm
    JOIN "group" g ON g.id = gm.group_id AND g.organization_id = ${orgId}
    JOIN course c ON c.group_id = g.id
    WHERE gm.profile_id = ${schema.profile.id}
  ) course_stats
) enrolment`;

const enrolledCountSql = sql<number>`COALESCE(enrolment.enrolled_count, 0)`;
const completedCountSql = sql<number>`COALESCE(enrolment.completed_count, 0)`;
const inProgressCountSql = sql<number>`COALESCE(enrolment.in_progress_count, 0)`;
const completedLessonsSql = sql<number>`COALESCE(enrolment.completed_lessons, 0)`;
const totalLessonsSql = sql<number>`COALESCE(enrolment.total_lessons, 0)`;

/**
 * Latest invite for the row's email, used to filter on invite status in SQL
 * rather than after pagination.
 *
 * The states here mirror `deriveAudienceMemberStatus`
 * (`apps/api/src/utils/audience-member-status.ts`), which stays the single
 * owner of the rule for the value actually returned to the client. Keep the two
 * in step: this exists only so the filter can run before `LIMIT`.
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
 * Builds a staleness predicate: "this timestamp is older than the window, or
 * absent entirely". `never` matches only absence.
 *
 * `joinedAtSql` is passed so `excludeRecentJoiners` can drop learners who have
 * not existed long enough to be judged dormant — otherwise "never logged in"
 * sweeps up everyone invited last week.
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
 * Folds the per-course states into one exclusive learner state.
 *
 * The buckets are matched by precedence rather than as three independent
 * predicates, so they provably partition the enrolled population and the view
 * counts sum to the total. Learners with no enrolment at all match none of them
 * and are reachable only through `enrollment=not_enrolled`.
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
 * Single audience member, shaped exactly like a row from
 * `getOrganizationAudience` so the detail view and the list agree on every
 * lifecycle and progress field.
 *
 * Deliberately not filtered by status: an admin following a link to an archived
 * learner should still be able to see them.
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
      profileCreatedAt: schema.profile.createdAt,
      memberCreatedAt: schema.organizationmember.createdAt,
      memberStatus: schema.organizationmember.status,
      lastActiveAt: schema.organizationmember.lastActiveAt,
      lastLoginAt: lastLoginAtSql.as('lastLoginAt'),
      enrolledCount: enrolledCountSql.as('enrolledCount'),
      completedCount: completedCountSql.as('completedCount'),
      completedLessons: completedLessonsSql.as('completedLessons'),
      totalLessons: totalLessonsSql.as('totalLessons')
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
  const createdAtRaw = row.profileId ? row.profileCreatedAt : row.memberCreatedAt;
  const createdAt = createdAtRaw ? new Date(createdAtRaw).toDateString() : '';
  const totalLessons = Number(row.totalLessons ?? 0);
  const completedLessons = Number(row.completedLessons ?? 0);

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
    progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  };
};

/**
 * Gets organization audience (all organization members with student role).
 * Includes invited members without a profile (LEFT JOIN profile).
 * Row id is organizationmember.id; use profileId for profile-backed actions when present.
 *
 * The count query and the row query deliberately share one `whereClause`, so a
 * bulk action resolved from a filter cannot target a different set than the one
 * the admin was shown.
 */
export const getOrganizationAudience = async (orgId: string, options: GetOrganizationAudienceOptions = {}) => {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
  const offset = (page - 1) * limit;
  const search = options.search?.trim();
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder = options.sortOrder ?? 'desc';
  const status = options.status ?? 'ACTIVE';
  const excludeRecentJoiners = options.excludeRecentJoiners ?? true;

  const audienceNameSql = sql<string>`COALESCE(NULLIF(${schema.profile.fullname}, ''), ${schema.profile.email}, ${schema.organizationmember.email})`;
  const audienceEmailSql = sql<string>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`;
  const audienceCreatedAtSql = sql<string>`COALESCE(${schema.profile.createdAt}, ${schema.organizationmember.createdAt})`;
  // The dormancy grace period keys off when they joined *this organization*,
  // not when their account was created. A long-standing account invited here
  // last week is still a recent joiner, and an account created moments ago can
  // be backfilled into an org it has belonged to for a year.
  const joinedOrgAtSql = sql<string>`${schema.organizationmember.createdAt}`;
  const lastActiveAtSql = sql<string | null>`${schema.organizationmember.lastActiveAt}`;
  const enrolmentLateral = enrolmentSummaryLateral(orgId);

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

  const whereClause = and(...conditions)!;

  // The enrolment lateral is the expensive part of this query, and only the
  // enrolment and completion filters make the count depend on it. Joining it
  // unconditionally would pay for per-learner lesson counts on every page load
  // of every org, including the common unfiltered one.
  const countNeedsEnrolment = Boolean(options.enrollment || options.completion);

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

  // Dormancy sorting is the "worst offenders first" view, so a learner with no
  // activity at all must sort as the stalest rather than drifting to the end.
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
      profileCreatedAt: schema.profile.createdAt,
      memberCreatedAt: schema.organizationmember.createdAt,
      memberStatus: schema.organizationmember.status,
      lastActiveAt: schema.organizationmember.lastActiveAt,
      lastLoginAt: lastLoginAtSql.as('lastLoginAt'),
      enrolledCount: enrolledCountSql.as('enrolledCount'),
      completedCount: completedCountSql.as('completedCount'),
      completedLessons: completedLessonsSql.as('completedLessons'),
      totalLessons: totalLessonsSql.as('totalLessons')
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
      const createdAtRaw = row.profileId ? row.profileCreatedAt : row.memberCreatedAt;
      const createdAt = createdAtRaw ? new Date(createdAtRaw).toDateString() : '';
      const totalLessons = Number(row.totalLessons ?? 0);
      const completedLessons = Number(row.completedLessons ?? 0);
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

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
