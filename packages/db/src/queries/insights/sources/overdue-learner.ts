import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  rowsMetric,
  scopePushdownFilters,
  textMetric,
  valueMetric
} from './helpers';

export const overdueLearnerSource: InsightsSourceDefinition = {
  id: 'overdue_learner',
  scopeTypes: ['cohort', 'course'],
  build: () => sql`SELECT * FROM overdue_learner_row`,
  dimensions: {
    learner: idDimension('profile_id', 'fullname')
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    email: textMetric('email'),
    course_titles: valueMetric('text', 'course_titles'),
    item_titles: valueMetric('text', 'item_titles'),
    course_progress_pct: percentMetric('course_progress_pct'),
    last_login_at: valueMetric('datetime', 'last_login_at'),
    days_overdue: numberMetric('days_overdue'),
    has_goal: flagMetric('has_goal')
  },
  filters: { course: scopePushdownFilters.course, learner: scopePushdownFilters.learner },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
