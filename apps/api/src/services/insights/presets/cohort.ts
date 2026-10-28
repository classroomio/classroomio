import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import {
  courseSummarySpec,
  hardestQuestionsWidget,
  studentStatusSpec,
  studentsTableWidget,
  loginsPerDaySpec,
  needsAttentionWidget,
  pickedCourse,
  sectionActivitySpec,
  sectionScorecardWidget
} from './shared';

export const COHORT_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_logged_in_today',
    titleKey: 'insights.widgets.kpi_logged_in_today.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'student',
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
      source: 'student',
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
    spec: { source: 'student', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_overdue',
    titleKey: 'insights.widgets.kpi_overdue.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'student',
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
      source: 'student',
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
    pageGroup: 'courses_chart',
    spec: courseSummarySpec(INSIGHTS_LIMITS.chartPageSize)
  },
  {
    id: 'students_by_status',
    titleKey: 'insights.widgets.students_by_status.title',
    viz: 'donut',
    span: 5,
    courseMode: 'all',
    spec: studentStatusSpec
  },
  {
    id: 'course_details',
    titleKey: 'insights.widgets.course_details.title',
    viz: 'table',
    span: 12,
    courseMode: 'all',
    pageGroup: 'courses',
    spec: courseSummarySpec(INSIGHTS_LIMITS.cardPageSize)
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
      source: 'student_course',
      filters: [pickedCourse],
      dimensions: ['progress_bucket_25'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'progress_bucket_25', dir: 'asc' }]
    }
  },
  {
    id: 'students_by_status_course',
    titleKey: 'insights.widgets.students_by_status.title',
    viz: 'donut',
    span: 5,
    courseMode: 'single',
    spec: { ...studentStatusSpec, filters: [pickedCourse] }
  },
  {
    id: 'section_scores',
    titleKey: 'insights.widgets.section_scores.title',
    viz: 'grouped_bar',
    span: 7,
    courseMode: 'single',
    requires: ['grouping'],
    pageGroup: 'sections_chart',
    spec: sectionActivitySpec(INSIGHTS_LIMITS.chartPageSize)
  },
  {
    id: 'score_distribution_course',
    titleKey: 'insights.widgets.score_distribution.title',
    viz: 'histogram',
    span: 5,
    courseMode: 'single',
    usesRange: true,
    spec: {
      source: 'student',
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
    pageGroup: 'overdue',
    spec: {
      source: 'overdue_student',
      dimensions: ['student'],
      measures: [
        { metric: 'name', agg: 'value' },
        { metric: 'course_titles', agg: 'value' },
        { metric: 'item_titles', agg: 'value' },
        { metric: 'course_progress_pct', agg: 'value' },
        { metric: 'last_login_at', agg: 'value' },
        { metric: 'days_overdue', agg: 'value' },
        { metric: 'has_goal', agg: 'value' }
      ],
      sort: [
        { field: 'has_goal__value', dir: 'desc' },
        { field: 'days_overdue__value', dir: 'desc' }
      ],
      limit: INSIGHTS_LIMITS.cardPageSize
    }
  },
  hardestQuestionsWidget,
  studentsTableWidget,
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
      source: 'student',
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
