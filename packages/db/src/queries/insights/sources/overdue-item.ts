import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  idDimension,
  numberMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  textMetric,
  valueMetric
} from './helpers';

export const overdueItemSource: InsightsSourceDefinition = {
  id: 'overdue_item',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM overdue_row`,
  dimensions: {
    item: { valueType: 'text', key: baseColumn('item_key') },
    student: idDimension('profile_id', 'fullname'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    overdue_kind: { valueType: 'text', key: baseColumn('kind') }
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    email: textMetric('email'),
    kind: textMetric('kind'),
    title: textMetric('item_title'),
    course_titles: textMetric('course_titles'),
    due_at: valueMetric('datetime', 'due_at'),
    days_overdue: numberMetric('days_overdue'),
    assignment_id: valueMetric('id', 'assignment_id')
  },
  filters: {
    ...scopePushdownFilters,
    overdue_kind: predicateFilter('kind', 'text', ['eq'], ['goal', 'compliance', 'exercise'])
  },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
