import { sql } from 'drizzle-orm';
import { ROLE } from '@cio/utils/constants';

import { pathCourseIsActiveSql } from '../../learning-path/learning-path-course';
import { ACTIVE_WINDOW_DAYS } from '../../learning-path/analytics';
import type { AnalyticsSourceDefinition } from '../types';
import {
  baseColumn,
  idDimension,
  integerMetric,
  percentMetric,
  pooledMetric,
  predicateFilter,
  rowsMetric,
  textMetric,
  valueMetric
} from './helpers';

/**
 * One row per active learning path of the org. Counts follow the path analytics page: enrolled, non-removed
 * student members, and active means a lesson completion or submission in a path course in the last 14 days.
 */
export const pathSummarySource: AnalyticsSourceDefinition = {
  id: 'path_summary',
  scopeTypes: ['org'],
  build: ({ scope }) => sql`
    SELECT
      lp.id AS path_id,
      lp.name AS path_name,
      lp.public_id AS path_public_id,
      lp.created_at AS path_created_at,
      path_courses.courses,
      members.students,
      members.avg_progress_pct,
      members.completed_students,
      members.in_progress_students,
      members.not_started_students,
      members.active_students,
      certificates.certificates
    FROM learning_path lp
    CROSS JOIN LATERAL (
      SELECT COUNT(*)::int AS courses, COALESCE(array_agg(lpc.course_id), '{}') AS course_ids
      FROM learning_path_course lpc
      JOIN course c ON c.id = lpc.course_id
      WHERE lpc.learning_path_id = lp.id AND ${pathCourseIsActiveSql({ link: sql`lpc`, course: sql`c` })}
    ) path_courses
    CROSS JOIN LATERAL (
      SELECT
        COUNT(*)::int AS students,
        ROUND(AVG(lpm.progress_percent), 1) AS avg_progress_pct,
        COUNT(*) FILTER (WHERE lpm.status = 'COMPLETED')::int AS completed_students,
        COUNT(*) FILTER (WHERE lpm.status = 'IN_PROGRESS')::int AS in_progress_students,
        COUNT(*) FILTER (WHERE lpm.status = 'NOT_STARTED')::int AS not_started_students,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM lesson_completion lc
            JOIN lesson l ON l.id = lc.lesson_id
            WHERE lc.profile_id = lpm.profile_id
              AND l.course_id = ANY (path_courses.course_ids)
              AND lc.created_at >= NOW() - make_interval(days => ${ACTIVE_WINDOW_DAYS})
          )
          OR EXISTS (
            SELECT 1
            FROM submission s
            JOIN groupmember gm ON gm.id = s.submitted_by
            WHERE gm.profile_id = lpm.profile_id
              AND s.course_id = ANY (path_courses.course_ids)
              AND s.updated_at >= NOW() - make_interval(days => ${ACTIVE_WINDOW_DAYS})
          )
        )::int AS active_students
      FROM learning_path_member lpm
      WHERE lpm.learning_path_id = lp.id AND lpm.removed_at IS NULL AND lpm.role_id = ${ROLE.STUDENT}
    ) members
    CROSS JOIN LATERAL (
      SELECT COUNT(*)::int AS certificates
      FROM learning_path_certificate_issue issue
      JOIN learning_path_member lpm ON lpm.id = issue.learning_path_member_id
      WHERE issue.learning_path_id = lp.id AND lpm.removed_at IS NULL AND lpm.role_id = ${ROLE.STUDENT}
    ) certificates
    WHERE lp.organization_id = ${scope.orgId} AND lp.status = 'ACTIVE'`,
  dimensions: {
    path: idDimension('path_id', 'path_name')
  },
  metrics: {
    rows: rowsMetric,
    path_public_id: textMetric('path_public_id'),
    path_created_at: valueMetric('datetime', 'path_created_at'),
    courses: integerMetric('courses'),
    students: integerMetric('students'),
    avg_progress_pct: percentMetric('avg_progress_pct'),
    completed_students: integerMetric('completed_students'),
    in_progress_students: integerMetric('in_progress_students'),
    not_started_students: integerMetric('not_started_students'),
    active_students: integerMetric('active_students'),
    certificates: integerMetric('certificates'),
    completion_pct: pooledMetric(baseColumn('completed_students'), baseColumn('students'))
  },
  filters: {
    students: predicateFilter('students', 'integer', ['gte', 'lt'])
  },
  searchColumns: [baseColumn('path_name')]
};
