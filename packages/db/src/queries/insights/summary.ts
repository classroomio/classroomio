import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

import { plainScopeContext, scopeCtes } from './scope';
import type { InsightsScopeCourse, InsightsScopeRef, InsightsScopeSummary } from './types';

function scopeNameSql(scope: InsightsScopeRef): SQL {
  if (scope.type === 'cohort') return sql`(SELECT name FROM cohort WHERE id = ${scope.id})`;

  if (scope.type === 'course') return sql`(SELECT title FROM course WHERE id = ${scope.id})`;

  return sql`(SELECT name FROM organization WHERE id = ${scope.orgId})`;
}

function pendingCountSql(scope: InsightsScopeRef): SQL {
  if (scope.type !== 'cohort') return sql`0`;

  return sql`(
    SELECT COUNT(*) FROM cohort_member
    WHERE cohort_id = ${scope.id} AND role_id = ${ROLE.STUDENT} AND profile_id IS NULL
  )`;
}

function scopeDescriptionSql(scope: InsightsScopeRef): SQL {
  if (scope.type === 'cohort') return sql`(SELECT NULLIF(description, '') FROM cohort WHERE id = ${scope.id})`;

  return sql`NULL::text`;
}

function cohortCountSql(scope: InsightsScopeRef): SQL {
  if (scope.type === 'course') {
    return sql`(
      SELECT COUNT(DISTINCT cohort.id) FROM cohort
      JOIN cohort_course cc ON cc.cohort_id = cohort.id AND cc.course_id = ${scope.id}
      WHERE cohort.organization_id = ${scope.orgId} AND cohort.status <> 'ARCHIVED'
    )`;
  }

  if (scope.type === 'org') {
    return sql`(SELECT COUNT(*) FROM cohort WHERE organization_id = ${scope.orgId} AND status <> 'ARCHIVED')`;
  }

  return sql`0`;
}

function activeCohortCountSql(scope: InsightsScopeRef): SQL {
  if (scope.type !== 'org') return sql`0`;

  return sql`(SELECT COUNT(*) FROM cohort WHERE organization_id = ${scope.orgId} AND status = 'ACTIVE')`;
}

function studentTargetSql(scope: InsightsScopeRef): SQL {
  if (scope.type !== 'org') return sql`NULL::int`;

  return sql`(SELECT (settings -> 'insights' ->> 'studentTarget')::int FROM organization WHERE id = ${scope.orgId})`;
}

/**
 * Name, student counts and in-scope courses for a dashboard header. The caller must authorize the scope first.
 */
export async function getInsightsScopeSummary(
  scope: InsightsScopeRef,
  dbClient: DbOrTxClient = db
): Promise<InsightsScopeSummary> {
  try {
    const result = await dbClient.execute(sql`
      WITH ${scopeCtes(plainScopeContext(scope))}
      SELECT
        COALESCE(${scopeNameSql(scope)}, '') AS name,
        ${scopeDescriptionSql(scope)} AS description,
        (SELECT COUNT(DISTINCT profile_id) FROM scope_student)::int AS student_count,
        ${pendingCountSql(scope)}::int AS pending_count,
        ${cohortCountSql(scope)}::int AS cohort_count,
        ${activeCohortCountSql(scope)}::int AS active_cohort_count,
        ${studentTargetSql(scope)} AS student_target,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', sc.course_id,
            'title', sc.course_title,
            'isGrouped', sc.is_grouped,
            'hasPassRequired', EXISTS (
              SELECT 1 FROM exercise
              LEFT JOIN course_section ON course_section.id = exercise.section_id
              WHERE COALESCE(exercise.course_id, course_section.course_id) = sc.course_id
                AND exercise.completion_policy = 'passed'
            )
          ) ORDER BY sc.course_title)
          FROM scope_course sc
        ), '[]'::json) AS courses`);
    const [row] = Array.from(result) as Array<{
      name: string;
      description: string | null;
      student_count: number;
      pending_count: number;
      cohort_count: number;
      active_cohort_count: number;
      student_target: number | null;
      courses: InsightsScopeCourse[];
    }>;

    return {
      name: row?.name ?? '',
      description: row?.description ?? null,
      studentCount: row?.student_count ?? 0,
      pendingCount: row?.pending_count ?? 0,
      cohortCount: row?.cohort_count ?? 0,
      activeCohortCount: row?.active_cohort_count ?? 0,
      studentTarget: row?.student_target ?? null,
      courses: row?.courses ?? []
    };
  } catch (error) {
    console.error('getInsightsScopeSummary error:', error);
    throw new Error(`Failed to load insights scope: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Ids of the active, non-template courses an authorized scope covers.
 */
export async function listInsightsScopeCourseIds(
  scope: InsightsScopeRef,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  try {
    const result = await dbClient.execute(sql`
      WITH ${scopeCtes(plainScopeContext(scope))}
      SELECT course_id FROM scope_course`);

    return (Array.from(result) as Array<{ course_id: string }>).map((row) => row.course_id);
  } catch (error) {
    console.error('listInsightsScopeCourseIds error:', error);
    throw new Error(
      `Failed to list insights scope courses: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
