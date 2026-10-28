import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagMetric,
  idDimension,
  percentMetric,
  pooledMetric,
  rowsMetric,
  scopePushdownFilters
} from './helpers';

export const sectionActivitySource: InsightsSourceDefinition = {
  id: 'section_activity',
  scopeTypes: ['cohort', 'course'],
  build: () => sql`SELECT * FROM section_row`,
  dimensions: {
    section: idDimension('section_id', 'section_title', 'section_rank'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    section_score_pct: percentMetric('section_score_pct'),
    video_pct: percentMetric('video_pct'),
    attendance: pooledMetric(baseColumn('attendance_present'), baseColumn('attendance_lessons')),
    took_all: flagMetric('took_all'),
    passed_first_try: flagMetric('passed_first_try')
  },
  filters: { ...scopePushdownFilters }
};
