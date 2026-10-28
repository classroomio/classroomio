import { sql } from 'drizzle-orm';

import { INSIGHTS_STATUSES } from '@cio/utils/constants/insights';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagFilter,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  scoreBucketDimension,
  textMetric,
  valueMetric
} from './helpers';

export const studentSource: InsightsSourceDefinition = {
  id: 'student',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM student_row`,
  dimensions: {
    student: idDimension('profile_id', 'fullname'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    status: { valueType: 'text', key: baseColumn('status'), rank: baseColumn('status_rank') },
    score_bucket_10: scoreBucketDimension('avg_score_pct')
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    email: textMetric('email'),
    avatar_url: valueMetric('text', 'avatar_url'),
    overall_progress_pct: percentMetric('overall_progress_pct'),
    avg_score_pct: percentMetric('avg_score_pct'),
    video_pct: percentMetric('video_pct'),
    attendance_pct: percentMetric('attendance_pct'),
    courses_total: numberMetric('courses_total'),
    courses_completed: numberMetric('courses_completed'),
    certificates: numberMetric('certificates'),
    last_login_at: valueMetric('datetime', 'last_login_at'),
    days_since_login: numberMetric('days_since_login'),
    logged_in_today: flagMetric('logged_in_today'),
    logged_in_period: flagMetric('logged_in_period'),
    is_overdue: flagMetric('is_overdue'),
    is_inactive: flagMetric('is_inactive'),
    is_low_score: flagMetric('is_low_score'),
    is_low_video: flagMetric('is_low_video'),
    is_at_risk: flagMetric('is_at_risk'),
    is_completed_all: flagMetric('is_completed_all'),
    status: textMetric('status'),
    status_rank: numberMetric('status_rank'),
    overall_progress_pct_existing: percentMetric('overall_progress_pct_existing'),
    overall_progress_pct_at_period_start: percentMetric('overall_progress_pct_at_period_start'),
    completed_all_in_period: flagMetric('completed_all_in_period'),
    has_overdue_goal: flagMetric('has_overdue_goal'),
    now_at_title: valueMetric('text', 'now_at_title')
  },
  filters: {
    ...scopePushdownFilters,
    status: predicateFilter('status', 'text', ['eq'], INSIGHTS_STATUSES),
    avg_score_pct: predicateFilter('avg_score_pct', 'percent', ['gte', 'lt']),
    logged_in_today: flagFilter('logged_in_today'),
    is_inactive: flagFilter('is_inactive'),
    is_overdue: flagFilter('is_overdue'),
    is_completed_all: flagFilter('is_completed_all'),
    has_certificate: flagFilter('has_certificate')
  },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
