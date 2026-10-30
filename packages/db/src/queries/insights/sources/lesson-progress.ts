import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import { flagMetric, idDimension, rowsMetric, scopePushdownFilters } from './helpers';

/** One row per enrollment and lesson, with completion state. */
export const lessonProgressSource: InsightsSourceDefinition = {
  id: 'lesson_progress',
  scopeTypes: ['cohort', 'course'],
  build: () => sql`SELECT * FROM lesson_row`,
  dimensions: {
    lesson: idDimension('lesson_id', 'lesson_title', 'lesson_rank'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: { rows: rowsMetric, is_complete: flagMetric('is_complete') },
  filters: { ...scopePushdownFilters }
};
