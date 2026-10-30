import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagFilter,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  pooledMetric,
  progressBucketDimension,
  rowsMetric,
  scopePushdownFilters,
  textMetric,
  valueMetric
} from './helpers';

/** One row per enrollment, with progress, scores, completion and overdue state. */
export const studentCourseSource: InsightsSourceDefinition = {
  id: 'student_course',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM student_course_row`,
  dimensions: {
    student: idDimension('profile_id', 'fullname'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    progress_bucket_25: progressBucketDimension('progress_pct')
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    title: textMetric('course_title'),
    progress_pct: percentMetric('progress_pct'),
    progress_pct_at_period_start: percentMetric('progress_pct_at_period_start'),
    avg_score_pct: percentMetric('avg_score_pct'),
    score_points: pooledMetric(baseColumn('graded_points'), baseColumn('graded_max_points')),
    first_try_pass: pooledMetric(baseColumn('first_try_passed'), baseColumn('first_try_graded')),
    pass_mark_exercises: numberMetric('pass_mark_exercises'),
    pass_mark_passed: numberMetric('pass_mark_passed'),
    still_to_pass: numberMetric('still_to_pass'),
    took_pass_mark: flagMetric('took_pass_mark'),
    has_still_to_pass: flagMetric('has_still_to_pass'),
    is_completed: flagMetric('is_completed'),
    is_certified: flagMetric('is_certified'),
    is_overdue: flagMetric('is_overdue'),
    enrolled_in_period: flagMetric('enrolled_in_period'),
    completed_in_period: flagMetric('completed_in_period'),
    completion_rate_at_period_start: pooledMetric(
      sql`(${baseColumn('completed_at_period_start')})::int`,
      sql`(${baseColumn('enrolled_at_period_start')})::int`
    ),
    days_to_finish: numberMetric('days_to_finish'),
    completed_in_window: flagMetric('completed_in_window'),
    certified_in_period: flagMetric('certified_in_period'),
    enrolled_at: valueMetric('datetime', 'enrolled_at'),
    course_created_at: valueMetric('datetime', 'course_created_at'),
    now_at_item_id: valueMetric('id', 'now_at_item_id'),
    now_at_title: valueMetric('text', 'now_at_title')
  },
  filters: {
    ...scopePushdownFilters,
    is_overdue: flagFilter('is_overdue')
  },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
