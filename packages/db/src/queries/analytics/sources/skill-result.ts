import { sql } from 'drizzle-orm';

import type { AnalyticsSourceDefinition } from '../types';
import {
  baseColumn,
  idDimension,
  integerMetric,
  numberMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  textMetric
} from './helpers';

/**
 * One row per learner (and cohort when grouped by cohort) and skill tagged on a scored question, with the mastery
 * score and level computed from their most recent graded attempts.
 */
export const skillResultSource: AnalyticsSourceDefinition = {
  id: 'skill_result',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT *, mastery_level IN ('proficient', 'mastered') AS is_proficient FROM skill_row`,
  dimensions: {
    skill: {
      valueType: 'id',
      key: baseColumn('skill_id'),
      label: sql`base.skill_code || ' ' || base.skill_name`
    },
    student: idDimension('profile_id', 'fullname'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    skill_mastery: numberMetric('mastery_score'),
    mastery_level: textMetric('mastery_level'),
    mastery_evidence: integerMetric('evidence_count'),
    skill_proficient: { valueType: 'boolean', value: baseColumn('is_proficient'), aggs: ['value', 'count_if', 'rate'] }
  },
  filters: {
    ...scopePushdownFilters,
    skill: predicateFilter('skill_id', 'id', ['eq', 'in'])
  }
};
