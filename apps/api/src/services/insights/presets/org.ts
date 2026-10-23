import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import { cohortSummarySpec, loginsPerDaySpec, needsAttentionWidget, notCompleted } from './shared';

const newestCohorts = cohortSummarySpec(INSIGHTS_LIMITS.glanceCohorts);

export const ORG_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_logged_in_week',
    titleKey: 'insights.widgets.kpi_logged_in_week.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'logged_in_period', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_progress_trend',
    titleKey: 'insights.widgets.kpi_avg_progress.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'overall_progress_pct', agg: 'avg' },
        { metric: 'overall_progress_pct_existing', agg: 'avg' },
        { metric: 'overall_progress_pct_at_period_start', agg: 'avg' }
      ]
    }
  },
  {
    id: 'kpi_completions',
    titleKey: 'insights.widgets.kpi_completions.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'rows', agg: 'count' },
        { metric: 'completed_in_period', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_certificates',
    titleKey: 'insights.widgets.kpi_certificates.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_certified', agg: 'count_if' },
        { metric: 'certified_in_period', agg: 'count_if' },
        { metric: 'is_completed', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_needs_attention',
    titleKey: 'insights.widgets.kpi_needs_attention.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      filters: [notCompleted],
      measures: [
        { metric: 'is_at_risk', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'cohorts_at_a_glance',
    titleKey: 'insights.widgets.cohorts_at_a_glance.title',
    viz: 'table',
    span: 8,
    spec: newestCohorts
  },
  { ...needsAttentionWidget, span: 4 },
  { id: 'cohort_health', titleKey: 'insights.widgets.cohort_health.title', viz: 'donut', span: 5, spec: newestCohorts },
  {
    id: 'hiring_ramp',
    titleKey: 'insights.widgets.hiring_ramp.title',
    viz: 'line',
    span: 7,
    usesRange: true,
    spec: {
      source: 'org_member',
      dimensions: ['period'],
      measures: [{ metric: 'members_total', agg: 'value' }],
      sort: [{ field: 'period', dir: 'asc' }],
      limit: INSIGHTS_LIMITS.maxRangeDays
    }
  },
  {
    id: 'logins_per_day',
    titleKey: 'insights.widgets.logins_per_day.title',
    viz: 'line',
    span: 7,
    usesRange: true,
    spec: loginsPerDaySpec
  },
  {
    id: 'avg_score_by_cohort',
    titleKey: 'insights.widgets.avg_score_by_cohort.title',
    viz: 'hbar',
    span: 5,
    spec: newestCohorts
  },
  {
    id: 'courses_by_completion',
    titleKey: 'insights.widgets.courses_by_completion.title',
    viz: 'hbar',
    span: 12,
    spec: {
      source: 'learner_course',
      dimensions: ['course'],
      measures: [{ metric: 'is_completed', agg: 'rate' }],
      sort: [{ field: 'is_completed__rate', dir: 'desc' }],
      limit: 10
    }
  }
];
