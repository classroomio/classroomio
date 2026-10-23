import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import {
  hardestQuestionsWidget,
  learnerStatusSpec,
  learnersTableWidget,
  loginsPerDaySpec,
  needsAttentionWidget,
  pickedCourse,
  sectionScorecardWidget,
  selectedLearner
} from './shared';

export const COHORT_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_logged_in_today',
    titleKey: 'insights.widgets.kpi_logged_in_today.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'logged_in_today', agg: 'count_if' },
        { metric: 'logged_in_period', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_avg_progress',
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
    id: 'kpi_avg_score',
    titleKey: 'insights.widgets.kpi_avg_score.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: { source: 'learner', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_overdue',
    titleKey: 'insights.widgets.kpi_overdue.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'is_overdue', agg: 'count_if' },
        { metric: 'has_overdue_goal', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_completed',
    titleKey: 'insights.widgets.kpi_completed.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'is_completed_all', agg: 'count_if' },
        { metric: 'completed_all_in_period', agg: 'count_if' },
        { metric: 'certificates', agg: 'sum' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'courses_summary',
    titleKey: 'insights.widgets.courses_summary.title',
    viz: 'grouped_bar',
    span: 7,
    courseMode: 'all',
    spec: {
      source: 'learner_course',
      dimensions: ['course'],
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'progress_pct', agg: 'avg' },
        { metric: 'avg_score_pct', agg: 'avg' },
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  {
    id: 'learners_by_status',
    titleKey: 'insights.widgets.learners_by_status.title',
    viz: 'donut',
    span: 5,
    courseMode: 'all',
    spec: learnerStatusSpec
  },
  {
    id: 'course_details',
    titleKey: 'insights.widgets.course_details.title',
    viz: 'table',
    span: 12,
    courseMode: 'all',
    spec: {
      source: 'learner_course',
      dimensions: ['course'],
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'progress_pct', agg: 'avg' },
        { metric: 'avg_score_pct', agg: 'avg' },
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  {
    id: 'learner_courses',
    titleKey: 'insights.widgets.learner_courses.title',
    viz: 'table',
    span: 12,
    courseMode: 'all',
    spec: {
      source: 'learner_course',
      filters: [selectedLearner],
      dimensions: ['course'],
      measures: [
        { metric: 'progress_pct', agg: 'value' },
        { metric: 'now_at_title', agg: 'value' },
        { metric: 'avg_score_pct', agg: 'value' },
        { metric: 'pass_mark_passed', agg: 'value' },
        { metric: 'pass_mark_exercises', agg: 'value' },
        { metric: 'still_to_pass', agg: 'value' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  {
    id: 'scores_by_exercise',
    titleKey: 'insights.widgets.scores_by_exercise.title',
    viz: 'line_band',
    span: 7,
    courseMode: 'single',
    usesRange: true,
    spec: {
      source: 'assessment_result',
      filters: [pickedCourse],
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'avg' },
        { metric: 'best_score_pct', agg: 'p25' },
        { metric: 'best_score_pct', agg: 'p75' },
        { metric: 'is_graded', agg: 'count_if' },
        { metric: 'is_attempted', agg: 'count_if' }
      ],
      sort: [{ field: 'exercise', dir: 'asc' }],
      limit: 200
    }
  },
  {
    id: 'progress_distribution',
    titleKey: 'insights.widgets.progress_distribution.title',
    viz: 'column',
    span: 5,
    courseMode: 'single',
    spec: {
      source: 'learner_course',
      filters: [pickedCourse],
      dimensions: ['progress_bucket_25'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'progress_bucket_25', dir: 'asc' }]
    }
  },
  {
    id: 'learner_progression',
    titleKey: 'insights.widgets.learner_progression.title',
    viz: 'line',
    span: 7,
    courseMode: 'single',
    usesRange: true,
    spec: {
      source: 'assessment_result',
      filters: [pickedCourse, selectedLearner],
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'value' },
        { metric: 'state', agg: 'value' }
      ],
      sort: [{ field: 'exercise', dir: 'asc' }],
      limit: 200
    }
  },
  {
    id: 'learners_by_status_course',
    titleKey: 'insights.widgets.learners_by_status.title',
    viz: 'donut',
    span: 5,
    courseMode: 'single',
    spec: { ...learnerStatusSpec, filters: [pickedCourse] }
  },
  {
    id: 'section_scores',
    titleKey: 'insights.widgets.section_scores.title',
    viz: 'grouped_bar',
    span: 7,
    courseMode: 'single',
    requires: ['grouping'],
    spec: {
      source: 'section_activity',
      filters: [pickedCourse],
      dimensions: ['section'],
      measures: [
        { metric: 'section_score_pct', agg: 'avg' },
        { metric: 'video_pct', agg: 'avg' },
        { metric: 'attendance', agg: 'pooled' }
      ],
      sort: [{ field: 'section', dir: 'asc' }],
      limit: 100
    }
  },
  {
    id: 'score_distribution_course',
    titleKey: 'insights.widgets.score_distribution.title',
    viz: 'histogram',
    span: 5,
    courseMode: 'single',
    usesRange: true,
    spec: {
      source: 'learner',
      filters: [pickedCourse],
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  sectionScorecardWidget,
  needsAttentionWidget,
  {
    id: 'overdue',
    titleKey: 'insights.widgets.overdue.title',
    viz: 'table',
    span: 7,
    spec: {
      source: 'overdue_learner',
      dimensions: ['learner'],
      measures: [
        { metric: 'name', agg: 'value' },
        { metric: 'course_titles', agg: 'value' },
        { metric: 'item_titles', agg: 'value' },
        { metric: 'course_progress_pct', agg: 'value' },
        { metric: 'last_login_at', agg: 'value' },
        { metric: 'days_overdue', agg: 'value' },
        { metric: 'has_goal', agg: 'value' }
      ],
      sort: [{ field: 'days_overdue__value', dir: 'desc' }],
      limit: 5
    }
  },
  hardestQuestionsWidget,
  learnersTableWidget,
  {
    id: 'logins_per_day',
    titleKey: 'insights.widgets.logins_per_day.title',
    viz: 'column',
    span: 6,
    courseMode: 'all',
    usesRange: true,
    spec: loginsPerDaySpec
  },
  {
    id: 'score_distribution',
    titleKey: 'insights.widgets.score_distribution.title',
    viz: 'histogram',
    span: 6,
    courseMode: 'all',
    usesRange: true,
    spec: {
      source: 'learner',
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  {
    id: 'logins_per_day_course',
    titleKey: 'insights.widgets.logins_per_day.title',
    viz: 'column',
    span: 12,
    courseMode: 'single',
    usesRange: true,
    spec: loginsPerDaySpec
  }
];
