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
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  scoreBucketDimension,
  textMetric,
  valueMetric
} from './helpers';

/** One row per enrollment and exercise, with attempt, grading and pass state. */
export const assessmentResultSource: InsightsSourceDefinition = {
  id: 'assessment_result',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`
    SELECT
      assessment_row.*,
      state = 'graded' AS is_graded,
      state <> 'not_taken' AS is_attempted,
      state = 'awaiting_grade' AS is_awaiting_grade,
      CASE WHEN state = 'graded' AND max_points > 0 THEN best_points END AS graded_points,
      CASE WHEN state = 'graded' AND max_points > 0 THEN max_points END AS graded_max_points,
      passed_first_try::int AS first_try_hit,
      CASE WHEN passed_first_try IS NOT NULL THEN 1 END AS first_try_try
    FROM assessment_row`,
  dimensions: {
    exercise: idDimension('exercise_id', 'exercise_title', 'exercise_rank'),
    student: idDimension('profile_id', 'fullname'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    section: idDimension('section_id', undefined, 'section_rank'),
    score_bucket_10: scoreBucketDimension('best_score_pct')
  },
  metrics: {
    rows: rowsMetric,
    best_score_pct: percentMetric('best_score_pct'),
    score_points: pooledMetric(baseColumn('graded_points'), baseColumn('graded_max_points')),
    first_try_pass: pooledMetric(baseColumn('first_try_hit'), baseColumn('first_try_try')),
    passed_first_try: flagMetric('passed_first_try'),
    still_to_pass: flagMetric('still_to_pass'),
    pass_mark: valueMetric('integer', 'pass_mark'),
    attempts: numberMetric('attempts'),
    state: textMetric('state'),
    passed: flagMetric('passed'),
    is_pass_required: flagMetric('is_pass_required'),
    is_graded: flagMetric('is_graded'),
    is_attempted: flagMetric('is_attempted'),
    is_awaiting_grade: flagMetric('is_awaiting_grade'),
    is_complete: flagMetric('is_complete')
  },
  filters: {
    ...scopePushdownFilters,
    exercise: predicateFilter('exercise_id', 'id', ['eq', 'in']),
    section: predicateFilter('section_id', 'id', ['eq']),
    is_pass_required: flagFilter('is_pass_required'),
    is_attempted: flagFilter('is_attempted')
  }
};
