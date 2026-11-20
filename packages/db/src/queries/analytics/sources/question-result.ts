import { sql } from 'drizzle-orm';

import type { AnalyticsSourceDefinition } from '../types';
import {
  baseColumn,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  textMetric
} from './helpers';

/**
 * One row per enrollment, exercise and question, from the learner's best graded submission. Carries the item-analysis
 * metrics: facility, discrimination, common wrong answers and time on question.
 */
export const questionResultSource: AnalyticsSourceDefinition = {
  id: 'question_result',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM question_row`,
  dimensions: {
    question: idDimension('question_id', 'question_title', 'question_rank'),
    exercise: idDimension('exercise_id', 'exercise_title'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    correct_pct: percentMetric('correct_pct'),
    wrong_answer: textMetric('wrong_answer'),
    question_context: textMetric('question_context'),
    question_facility: flagMetric('is_correct'),
    question_discrimination: {
      valueType: 'number',
      value: baseColumn('score_ratio'),
      denominator: baseColumn('discrimination_group'),
      aggs: ['upper_lower_gap']
    },
    common_wrong_answers: {
      valueType: 'text',
      value: baseColumn('wrong_answer_json'),
      aggs: ['collect_json']
    },
    time_on_question: numberMetric('time_seconds')
  },
  filters: {
    ...scopePushdownFilters,
    exercise: predicateFilter('exercise_id', 'id', ['eq', 'in'])
  }
};
