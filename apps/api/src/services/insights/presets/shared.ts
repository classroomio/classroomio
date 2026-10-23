import { INSIGHTS_LIMITS, INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import type { TInsightsQuerySpecInput, TInsightsWidgetInput } from '@cio/utils/validation/insights';

export const pickedCourse = { field: 'course', op: 'eq', value: INSIGHTS_PLACEHOLDERS.course } as const;
export const selectedLearner = { field: 'learner', op: 'eq', value: INSIGHTS_PLACEHOLDERS.learner } as const;
export const pickedExercise = { field: 'exercise', op: 'eq', value: INSIGHTS_PLACEHOLDERS.exercise } as const;
export const notCompleted = { field: 'is_completed_all', op: 'is_false' } as const;

export const learnerStatusSpec: TInsightsQuerySpecInput = {
  source: 'learner',
  dimensions: ['status'],
  measures: [{ metric: 'rows', agg: 'count' }],
  sort: [{ field: 'status' }]
};

export const loginsPerDaySpec: TInsightsQuerySpecInput = {
  source: 'login_day',
  dimensions: ['day'],
  measures: [{ metric: 'logged_in', agg: 'count_if' }],
  sort: [{ field: 'day', dir: 'asc' }],
  days: 7,
  limit: INSIGHTS_LIMITS.maxRangeDays
};

/** Cohorts newest first, one shared spec for the paired cohort widgets of a scope. */
export function cohortSummarySpec(limit: number): TInsightsQuerySpecInput {
  return {
    source: 'cohort_summary',
    dimensions: ['cohort'],
    measures: [
      { metric: 'learners', agg: 'value' },
      { metric: 'pending_invites', agg: 'value' },
      { metric: 'avg_progress_pct', agg: 'value' },
      { metric: 'avg_score_pct', agg: 'value' },
      { metric: 'first_try_pass', agg: 'pooled' },
      { metric: 'overdue_learners', agg: 'value' },
      { metric: 'at_risk_learners', agg: 'value' },
      { metric: 'completed_learners', agg: 'value' },
      { metric: 'cohort_created_at', agg: 'value' }
    ],
    sort: [{ field: 'cohort_created_at__value', dir: 'desc' }],
    limit
  };
}

export const learnersTableWidget: TInsightsWidgetInput = {
  id: 'learners',
  titleKey: 'insights.widgets.learners.title',
  viz: 'matrix',
  span: 12,
  spec: {
    source: 'learner',
    dimensions: ['learner'],
    measures: [{ metric: 'name', agg: 'value' }],
    limit: INSIGHTS_LIMITS.learnersPageSize
  }
};

export const needsAttentionWidget: TInsightsWidgetInput = {
  id: 'needs_attention',
  titleKey: 'insights.widgets.needs_attention.title',
  viz: 'hbar',
  span: 5,
  spec: {
    source: 'learner',
    filters: [notCompleted],
    measures: [
      { metric: 'is_inactive', agg: 'count_if' },
      { metric: 'is_low_score', agg: 'count_if' },
      { metric: 'is_overdue', agg: 'count_if' },
      { metric: 'is_low_video', agg: 'count_if' }
    ]
  }
};

export const hardestQuestionsWidget: TInsightsWidgetInput = {
  id: 'hardest_questions',
  titleKey: 'insights.widgets.hardest_questions.title',
  viz: 'hbar',
  span: 12,
  courseMode: 'single',
  usesRange: true,
  spec: {
    source: 'question_result',
    filters: [pickedCourse],
    dimensions: ['question'],
    measures: [
      { metric: 'correct_pct', agg: 'avg' },
      { metric: 'wrong_answer', agg: 'mode' },
      { metric: 'question_context', agg: 'value' },
      { metric: 'rows', agg: 'count' }
    ],
    sort: [{ field: 'correct_pct__avg', dir: 'asc' }],
    minGroupRows: 5,
    limit: 5
  }
};

export const sectionScorecardWidget: TInsightsWidgetInput = {
  id: 'section_scorecard',
  titleKey: 'insights.widgets.section_scorecard.title',
  viz: 'table',
  span: 12,
  courseMode: 'single',
  requires: ['grouping'],
  spec: {
    source: 'section_activity',
    filters: [pickedCourse],
    dimensions: ['section'],
    measures: [
      { metric: 'rows', agg: 'count' },
      { metric: 'took_all', agg: 'count_if' },
      { metric: 'section_score_pct', agg: 'avg' },
      { metric: 'passed_first_try', agg: 'rate' },
      { metric: 'video_pct', agg: 'avg' },
      { metric: 'attendance', agg: 'pooled' }
    ],
    sort: [{ field: 'section', dir: 'asc' }],
    limit: 100
  }
};

/** A cohort-scope widget reused at course scope, where the scope already is the course. */
export function courseWide(widget: TInsightsWidgetInput): TInsightsWidgetInput {
  const spec = { ...widget.spec, filters: (widget.spec.filters ?? []).filter((filter) => filter.field !== 'course') };

  return { ...widget, courseMode: 'any', spec };
}
