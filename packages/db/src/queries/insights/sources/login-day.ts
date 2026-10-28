import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import { baseColumn, flagMetric, idDimension, rowsMetric, scopePushdownFilters } from './helpers';

export const loginDaySource: InsightsSourceDefinition = {
  id: 'login_day',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM login_day_row`,
  dimensions: {
    day: { valueType: 'date', key: baseColumn('day') },
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: { rows: rowsMetric, logged_in: flagMetric('logged_in') },
  filters: { ...scopePushdownFilters }
};
