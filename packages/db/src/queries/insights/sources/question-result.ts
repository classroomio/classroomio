import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  idDimension,
  percentMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  textMetric
} from './helpers';

/** One row per enrollment, exercise and question, from the learner's best graded submission. */
export const questionResultSource: InsightsSourceDefinition = {
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
    question_context: textMetric('question_context')
  },
  filters: {
    ...scopePushdownFilters,
    exercise: predicateFilter('exercise_id', 'id', ['eq', 'in'])
  }
};
