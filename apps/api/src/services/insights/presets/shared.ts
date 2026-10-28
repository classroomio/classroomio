import { INSIGHTS_LIMITS, INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import type { TInsightsQuerySpecInput, TInsightsWidgetInput } from '@cio/utils/validation/insights';

export const pickedCourse = { field: 'course', op: 'eq', value: INSIGHTS_PLACEHOLDERS.course } as const;
export const pickedExercise = { field: 'exercise', op: 'eq', value: INSIGHTS_PLACEHOLDERS.exercise } as const;
export const notCompleted = { field: 'is_completed_all', op: 'is_false' } as const;

export const studentStatusSpec: TInsightsQuerySpecInput = {
  source: 'student',
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

/**
 * One page of cohorts, newest first, shared by the paired cohort widgets of a scope. `studentsOnly` keeps the
 * page full for charts that have nothing to draw for a cohort without students; `emptyOnly` feeds the note that
 * names the cohorts a chart leaves out.
 */
export function cohortSummarySpec(
  limit: number,
  options: { studentsOnly?: boolean; emptyOnly?: boolean } = {}
): TInsightsQuerySpecInput {
  const spec: TInsightsQuerySpecInput = {
    source: 'cohort_summary',
    dimensions: ['cohort'],
    measures: [
      { metric: 'students', agg: 'value' },
      { metric: 'pending_invites', agg: 'value' },
      { metric: 'avg_progress_pct', agg: 'value' },
      { metric: 'avg_score_pct', agg: 'value' },
      { metric: 'first_try_pass', agg: 'pooled' },
      { metric: 'overdue_students', agg: 'value' },
      { metric: 'at_risk_students', agg: 'value' },
      { metric: 'completed_students', agg: 'value' },
      { metric: 'cohort_created_at', agg: 'value' }
    ],
    sort: [{ field: 'cohort_created_at__value', dir: 'desc' }],
    limit
  };

  if (options.studentsOnly) {
    spec.filters = [{ field: 'students', op: 'gte', value: 1 }];
  }

  if (options.emptyOnly) {
    spec.filters = [{ field: 'students', op: 'lt', value: 1 }];
  }

  return spec;
}

/** One page of courses, `limit` per page, in title order. */
export function courseSummarySpec(
  limit: number,
  options: { includeCreatedAt?: boolean } = {}
): TInsightsQuerySpecInput {
  const measures: TInsightsQuerySpecInput['measures'] = [
    { metric: 'rows', agg: 'count' },
    { metric: 'progress_pct', agg: 'avg' },
    { metric: 'avg_score_pct', agg: 'avg' },
    { metric: 'is_completed', agg: 'count_if' },
    { metric: 'took_pass_mark', agg: 'count_if' },
    { metric: 'first_try_pass', agg: 'pooled' }
  ];

  if (options.includeCreatedAt) {
    measures.push({ metric: 'course_created_at', agg: 'value' });
  }

  return {
    source: 'student_course',
    dimensions: ['course'],
    measures,
    sort: [{ field: 'course', dir: 'asc' }],
    limit
  };
}

export const studentsTableWidget: TInsightsWidgetInput = {
  id: 'students',
  titleKey: 'insights.widgets.students.title',
  viz: 'matrix',
  span: 12,
  spec: {
    source: 'student',
    dimensions: ['student'],
    measures: [{ metric: 'name', agg: 'value' }],
    limit: INSIGHTS_LIMITS.studentsPageSize
  }
};

export const needsAttentionWidget: TInsightsWidgetInput = {
  id: 'needs_attention',
  titleKey: 'insights.widgets.needs_attention.title',
  viz: 'hbar',
  span: 5,
  spec: {
    source: 'student',
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
    limit: INSIGHTS_LIMITS.hardestQuestions
  }
};

/** One page of a course's sections, `limit` per page, in course order. */
export function sectionActivitySpec(limit: number): TInsightsQuerySpecInput {
  return {
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
    limit
  };
}

export const sectionScorecardWidget: TInsightsWidgetInput = {
  id: 'section_scorecard',
  titleKey: 'insights.widgets.section_scorecard.title',
  viz: 'table',
  span: 12,
  courseMode: 'single',
  requires: ['grouping'],
  pageGroup: 'sections',
  spec: sectionActivitySpec(INSIGHTS_LIMITS.cardPageSize)
};

/** A cohort-scope widget reused at course scope, where the scope already is the course. */
export function courseWide(widget: TInsightsWidgetInput): TInsightsWidgetInput {
  const spec = { ...widget.spec, filters: (widget.spec.filters ?? []).filter((filter) => filter.field !== 'course') };

  return { ...widget, courseMode: 'any', spec };
}
