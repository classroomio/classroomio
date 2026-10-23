import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import {
  cohortSummarySpec,
  courseWide,
  hardestQuestionsWidget,
  learnersTableWidget,
  needsAttentionWidget,
  pickedExercise,
  sectionScorecardWidget
} from './shared';

const courseCohorts = cohortSummarySpec(100);

export const COURSE_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_enrolled',
    titleKey: 'insights.widgets.kpi_enrolled.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'enrolled_in_period', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_completion_rate',
    titleKey: 'insights.widgets.kpi_completion_rate.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_completed', agg: 'rate' },
        { metric: 'completion_rate_at_period_start', agg: 'pooled' }
      ]
    }
  },
  {
    id: 'kpi_avg_grade',
    titleKey: 'insights.widgets.kpi_avg_grade.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: { source: 'learner', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_first_try_pass',
    titleKey: 'insights.widgets.kpi_first_try_pass.title',
    viz: 'kpi',
    span: 4,
    requires: ['pass_required'],
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'first_try_pass', agg: 'pooled' },
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'has_still_to_pass', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_median_days',
    titleKey: 'insights.widgets.kpi_median_days.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: { source: 'learner_course', measures: [{ metric: 'days_to_finish', agg: 'median' }] }
  },
  {
    id: 'scores_by_exercise_by_cohort',
    titleKey: 'insights.widgets.scores_by_exercise_by_cohort.title',
    viz: 'multi_line',
    span: 7,
    usesRange: true,
    spec: {
      source: 'assessment_result',
      dimensions: ['exercise', 'cohort'],
      measures: [{ metric: 'best_score_pct', agg: 'avg' }],
      sort: [{ field: 'exercise', dir: 'asc' }],
      limit: 1000
    }
  },
  {
    id: 'exercise_score_distribution',
    titleKey: 'insights.widgets.exercise_score_distribution.title',
    viz: 'histogram',
    span: 5,
    usesRange: true,
    spec: {
      source: 'assessment_result',
      filters: [pickedExercise],
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  {
    id: 'lesson_dropoff',
    titleKey: 'insights.widgets.lesson_dropoff.title',
    viz: 'hbar',
    span: 6,
    spec: {
      source: 'lesson_progress',
      dimensions: ['lesson'],
      measures: [{ metric: 'is_complete', agg: 'rate' }],
      sort: [{ field: 'lesson', dir: 'asc' }],
      limit: 200
    }
  },
  {
    id: 'hardest_exercises',
    titleKey: 'insights.widgets.hardest_exercises.title',
    viz: 'grouped_bar',
    span: 6,
    usesRange: true,
    spec: {
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'avg' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'best_score_pct__avg', dir: 'asc' }],
      minGroupRows: 3,
      limit: INSIGHTS_LIMITS.hardestExercises
    }
  },
  courseWide(hardestQuestionsWidget),
  {
    id: 'cohorts_in_course',
    titleKey: 'insights.widgets.cohorts_in_course.title',
    viz: 'grouped_bar',
    span: 12,
    spec: courseCohorts
  },
  {
    id: 'cohort_details',
    titleKey: 'insights.widgets.cohort_details.title',
    viz: 'table',
    span: 12,
    spec: courseCohorts
  },
  courseWide(sectionScorecardWidget),
  needsAttentionWidget,
  learnersTableWidget
];
