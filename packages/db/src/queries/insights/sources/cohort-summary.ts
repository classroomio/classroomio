import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  idDimension,
  numberMetric,
  percentMetric,
  pooledMetric,
  rowsMetric,
  scopePushdownFilters,
  valueMetric
} from './helpers';

export const cohortSummarySource: InsightsSourceDefinition = {
  id: 'cohort_summary',
  scopeTypes: ['course', 'org'],
  requiresCohortBridge: true,
  build: () => sql`SELECT * FROM cohort_summary_row`,
  dimensions: {
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    learners: numberMetric('learners'),
    pending_invites: numberMetric('pending_invites'),
    avg_progress_pct: percentMetric('avg_progress_pct'),
    avg_score_pct: percentMetric('avg_score_pct'),
    overdue_learners: numberMetric('overdue_learners'),
    at_risk_learners: numberMetric('at_risk_learners'),
    completed_learners: numberMetric('completed_learners'),
    first_try_pass: pooledMetric(baseColumn('first_try_passed'), baseColumn('first_try_graded')),
    cohort_created_at: valueMetric('datetime', 'cohort_created_at')
  },
  filters: { cohort: scopePushdownFilters.cohort }
};
