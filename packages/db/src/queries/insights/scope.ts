import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { INSIGHTS_DEFAULT_PERIOD_DAYS } from '@cio/utils/constants/insights';

import type { InsightsCompileContext, InsightsOrderedItem, InsightsScopeRef } from './types';

/**
 * Comma-separated uuid parameters for an `IN (...)` list. Callers must pass a non-empty array.
 */
export function uuidList(values: readonly string[]): SQL {
  return sql.join(
    values.map((value) => sql`${value}::uuid`),
    sql`, `
  );
}

function scopeTypeCourseFilter(scope: InsightsScopeRef): SQL {
  if (scope.type === 'cohort') {
    return sql`AND co.id IN (
      SELECT cc.course_id
      FROM cohort_course cc
      JOIN cohort ch ON ch.id = cc.cohort_id
      WHERE cc.cohort_id = ${scope.id} AND ch.organization_id = ${scope.orgId}
    )`;
  }

  if (scope.type === 'course') return sql`AND co.id = ${scope.id}`;

  return sql``;
}

export function inactiveOrgMemberFilter(profileColumn: SQL, orgId: string): SQL {
  return sql`NOT EXISTS (
    SELECT 1
    FROM organizationmember om
    WHERE om.organization_id = ${orgId}
      AND om.profile_id = ${profileColumn}
      AND om.status <> 'ACTIVE'
  )`;
}

function scopeCourseSql(context: InsightsCompileContext): SQL {
  const { scope, pushdown } = context;
  const pushdownFilter = pushdown.courseIds?.length ? sql`AND co.id IN (${uuidList(pushdown.courseIds)})` : sql``;

  return sql`
    SELECT
      co.id AS course_id,
      co.group_id,
      co.title AS course_title,
      COALESCE((co.metadata ->> 'isContentGroupingEnabled')::boolean, true) AS is_grouped
    FROM course co
    JOIN "group" g ON g.id = co.group_id
    WHERE g.organization_id = ${scope.orgId}
      AND co.status = 'ACTIVE'
      AND co.is_template = false
      ${scopeTypeCourseFilter(scope)}
      ${pushdownFilter}`;
}

function cohortScopeLearnerSql(context: InsightsCompileContext): SQL {
  const { scope, pushdown } = context;
  const learnerFilter = pushdown.learnerIds?.length
    ? sql`AND cm.profile_id IN (${uuidList(pushdown.learnerIds)})`
    : sql``;

  return sql`
    SELECT DISTINCT cm.profile_id, ${scope.id}::uuid AS cohort_id
    FROM cohort_member cm
    JOIN cohort ch ON ch.id = cm.cohort_id AND ch.organization_id = ${scope.orgId}
    WHERE cm.cohort_id = ${scope.id}
      AND cm.role_id = ${ROLE.STUDENT}
      AND cm.profile_id IS NOT NULL
      AND ${inactiveOrgMemberFilter(sql`cm.profile_id`, scope.orgId)}
      ${learnerFilter}`;
}

function cohortScopeEnrollmentSql(): SQL {
  return sql`
    SELECT
      gm.id AS group_member_id,
      gm.profile_id,
      sc.course_id,
      sc.course_title,
      gm.created_at AS enrolled_at,
      gm.certificate_earned_at,
      sl.cohort_id
    FROM scope_course sc
    JOIN groupmember gm ON gm.group_id = sc.group_id AND gm.role_id = ${ROLE.STUDENT}
    JOIN scope_learner sl ON sl.profile_id = gm.profile_id`;
}

function cohortBridgeJoin(context: InsightsCompileContext): SQL {
  if (!context.byCohort) return sql``;

  return sql`
    LEFT JOIN LATERAL (
      SELECT cm.cohort_id
      FROM cohort_member cm
      JOIN cohort ch ON ch.id = cm.cohort_id AND ch.organization_id = ${context.scope.orgId} AND ch.status <> 'ARCHIVED'
      JOIN cohort_course cc ON cc.cohort_id = cm.cohort_id AND cc.course_id = sc.course_id
      WHERE cm.profile_id = gm.profile_id AND cm.role_id = ${ROLE.STUDENT}
    ) bridge ON true`;
}

function wideScopeEnrollmentSql(context: InsightsCompileContext): SQL {
  const { scope, pushdown, byCohort } = context;
  const cohortColumn = byCohort ? sql`bridge.cohort_id` : sql`NULL::uuid`;
  const learnerFilter = pushdown.learnerIds?.length
    ? sql`AND gm.profile_id IN (${uuidList(pushdown.learnerIds)})`
    : sql``;
  const cohortFilter =
    byCohort && pushdown.cohortIds?.length ? sql`AND bridge.cohort_id IN (${uuidList(pushdown.cohortIds)})` : sql``;

  return sql`
    SELECT
      gm.id AS group_member_id,
      gm.profile_id,
      sc.course_id,
      sc.course_title,
      gm.created_at AS enrolled_at,
      gm.certificate_earned_at,
      ${cohortColumn} AS cohort_id
    FROM scope_course sc
    JOIN groupmember gm ON gm.group_id = sc.group_id AND gm.role_id = ${ROLE.STUDENT} AND gm.profile_id IS NOT NULL
    ${cohortBridgeJoin(context)}
    WHERE ${inactiveOrgMemberFilter(sql`gm.profile_id`, scope.orgId)}
      ${learnerFilter}
      ${cohortFilter}`;
}

function orderedItemsSql(items: readonly InsightsOrderedItem[]): SQL {
  if (items.length === 0) {
    return sql`
      SELECT NULL::uuid AS course_id, NULL::uuid AS item_id, NULL::text AS item_type,
             NULL::int AS item_rank, NULL::uuid AS section_id, NULL::int AS section_rank
      WHERE false`;
  }

  const rows = items.map(
    (item) =>
      sql`(${item.courseId}::uuid, ${item.itemId}::uuid, ${item.itemType}::text, ${item.itemRank}::int, ${item.sectionId}::uuid, ${item.sectionRank}::int)`
  );

  return sql`
    SELECT * FROM (VALUES ${sql.join(rows, sql`, `)})
      AS ordered(course_id, item_id, item_type, item_rank, section_id, section_rank)`;
}

/**
 * The scope CTEs for one query: scope_course, scope_learner, scope_enrollment, scope_member and course_item.
 * Every row any source reads is reachable only through these, so the org id can never be widened by a spec.
 */
export function scopeCtes(context: InsightsCompileContext): SQL {
  const courseItem = orderedItemsSql(context.orderedItems);

  if (context.scope.type === 'cohort') {
    return sql`
      scope_course AS (${scopeCourseSql(context)}),
      scope_learner AS (${cohortScopeLearnerSql(context)}),
      scope_enrollment AS (${cohortScopeEnrollmentSql()}),
      scope_member AS (
        SELECT DISTINCT group_member_id, profile_id, course_id, course_title, enrolled_at, certificate_earned_at
        FROM scope_enrollment
      ),
      course_item AS (${courseItem})`;
  }

  return sql`
    scope_course AS (${scopeCourseSql(context)}),
    scope_enrollment AS (${wideScopeEnrollmentSql(context)}),
    scope_learner AS (SELECT DISTINCT profile_id, cohort_id FROM scope_enrollment),
    scope_member AS (
      SELECT DISTINCT group_member_id, profile_id, course_id, course_title, enrolled_at, certificate_earned_at
      FROM scope_enrollment
    ),
    course_item AS (${courseItem})`;
}

/**
 * A compile context with no filters, for summary and course-list queries.
 */
export function plainScopeContext(scope: InsightsScopeRef): InsightsCompileContext {
  return {
    scope,
    orderedItems: [],
    pushdown: {},
    byCohort: false,
    loginWindowDays: 14,
    rangeDays: null,
    periodDays: INSIGHTS_DEFAULT_PERIOD_DAYS
  };
}
