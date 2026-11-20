import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
import type { TAnalyticsWidgetInput } from '@cio/utils/validation/analytics';

import {
  courseSummarySpec,
  cohortSummarySpec,
  studentStatusSpec,
  loginsPerDaySpec,
  needsAttentionWidget,
  notCompleted
} from './shared';

const newestCohorts = cohortSummarySpec(ANALYTICS_LIMITS.cardPageSize);
const coursePage = courseSummarySpec(ANALYTICS_LIMITS.cardPageSize, { includeCreatedAt: true });
const pathPage: TAnalyticsWidgetInput['spec'] = {
  source: 'path_summary',
  dimensions: ['path'],
  measures: [
    { metric: 'path_public_id', agg: 'value' },
    { metric: 'courses', agg: 'value' },
    { metric: 'students', agg: 'value' },
    { metric: 'avg_progress_pct', agg: 'value' },
    { metric: 'completion_pct', agg: 'pooled' },
    { metric: 'completed_students', agg: 'value' },
    { metric: 'active_students', agg: 'value' },
    { metric: 'certificates', agg: 'value' }
  ],
  sort: [{ field: 'path', dir: 'asc' }],
  limit: ANALYTICS_LIMITS.cardPageSize
};

export const ORG_WIDGETS: readonly TAnalyticsWidgetInput[] = [
  {
    id: 'kpi_logged_in_week',
    titleKey: 'analytics.widgets.kpi_logged_in_week.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'student',
      measures: [
        { metric: 'logged_in_period', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_progress_trend',
    titleKey: 'analytics.widgets.kpi_avg_progress.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'student',
      measures: [
        { metric: 'overall_progress_pct', agg: 'avg' },
        { metric: 'overall_progress_pct_existing', agg: 'avg' },
        { metric: 'overall_progress_pct_at_period_start', agg: 'avg' }
      ]
    }
  },
  {
    id: 'kpi_completions',
    titleKey: 'analytics.widgets.kpi_completions.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'student_course',
      measures: [
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'rows', agg: 'count' },
        { metric: 'completed_in_period', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_certificates',
    titleKey: 'analytics.widgets.kpi_certificates.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'student_course',
      measures: [
        { metric: 'is_certified', agg: 'count_if' },
        { metric: 'certified_in_period', agg: 'count_if' },
        { metric: 'is_completed', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_needs_attention',
    titleKey: 'analytics.widgets.kpi_needs_attention.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'student',
      filters: [notCompleted],
      measures: [
        { metric: 'is_at_risk', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'courses_at_a_glance',
    titleKey: 'analytics.widgets.courses_at_a_glance.title',
    viz: 'table',
    span: 8,
    breakdown: 'courses',
    pageGroup: 'courses_breakdown',
    spec: coursePage
  },
  {
    id: 'paths_at_a_glance',
    titleKey: 'analytics.widgets.paths_at_a_glance.title',
    viz: 'table',
    span: 8,
    breakdown: 'paths',
    requires: ['paths'],
    pageGroup: 'paths',
    spec: pathPage
  },
  {
    id: 'cohorts_at_a_glance',
    titleKey: 'analytics.widgets.cohorts_at_a_glance.title',
    viz: 'table',
    span: 8,
    breakdown: 'cohorts',
    requires: ['cohorts'],
    pageGroup: 'cohorts',
    spec: newestCohorts
  },
  { ...needsAttentionWidget, span: 4 },
  {
    id: 'students_by_status',
    titleKey: 'analytics.widgets.students_by_status.title',
    viz: 'donut',
    span: 5,
    breakdown: 'courses',
    spec: studentStatusSpec
  },
  {
    id: 'cohort_health',
    titleKey: 'analytics.widgets.cohort_health.title',
    viz: 'donut',
    span: 5,
    breakdown: 'cohorts',
    requires: ['cohorts'],
    pageGroup: 'cohorts',
    spec: newestCohorts
  },
  {
    id: 'path_status',
    titleKey: 'analytics.widgets.path_status.title',
    viz: 'donut',
    span: 5,
    breakdown: 'paths',
    requires: ['paths'],
    spec: {
      source: 'path_summary',
      measures: [
        { metric: 'not_started_students', agg: 'sum' },
        { metric: 'in_progress_students', agg: 'sum' },
        { metric: 'completed_students', agg: 'sum' }
      ]
    }
  },
  {
    id: 'hiring_ramp',
    titleKey: 'analytics.widgets.hiring_ramp.title',
    viz: 'line',
    span: 7,
    usesRange: true,
    spec: {
      source: 'org_member',
      dimensions: ['period'],
      measures: [{ metric: 'members_total', agg: 'value' }],
      sort: [{ field: 'period', dir: 'asc' }],
      limit: ANALYTICS_LIMITS.maxRangeDays
    }
  },
  {
    id: 'logins_per_day',
    titleKey: 'analytics.widgets.logins_per_day.title',
    viz: 'line',
    span: 7,
    usesRange: true,
    spec: loginsPerDaySpec
  },
  {
    id: 'avg_score_by_course',
    titleKey: 'analytics.widgets.avg_score_by_course.title',
    viz: 'hbar',
    span: 5,
    breakdown: 'courses',
    pageGroup: 'courses_breakdown',
    spec: coursePage
  },
  {
    id: 'avg_score_by_cohort',
    titleKey: 'analytics.widgets.avg_score_by_cohort.title',
    viz: 'hbar',
    span: 5,
    breakdown: 'cohorts',
    requires: ['cohorts'],
    pageGroup: 'cohorts',
    spec: newestCohorts
  },
  {
    id: 'completion_by_path',
    titleKey: 'analytics.widgets.completion_by_path.title',
    viz: 'hbar',
    span: 5,
    breakdown: 'paths',
    requires: ['paths'],
    spec: {
      source: 'path_summary',
      dimensions: ['path'],
      measures: [
        { metric: 'completion_pct', agg: 'pooled' },
        { metric: 'students', agg: 'value' }
      ],
      sort: [{ field: 'completion_pct__pooled', dir: 'desc' }],
      filters: [{ field: 'students', op: 'gte', value: 1 }],
      limit: ANALYTICS_LIMITS.cardPageSize
    }
  },
  {
    id: 'courses_by_completion',
    titleKey: 'analytics.widgets.courses_by_completion.title',
    viz: 'hbar',
    span: 12,
    pageGroup: 'courses',
    spec: {
      source: 'student_course',
      dimensions: ['course'],
      measures: [{ metric: 'is_completed', agg: 'rate' }],
      sort: [{ field: 'is_completed__rate', dir: 'desc' }],
      limit: ANALYTICS_LIMITS.cardPageSize
    }
  }
];
