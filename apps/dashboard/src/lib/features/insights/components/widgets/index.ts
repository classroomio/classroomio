import type { Component } from 'svelte';

import type { InsightsWidget, WidgetRendererProps } from '../../utils/types';
import CohortDetails from './cohort-details.svelte';
import CohortHealth from './cohort-health.svelte';
import CohortsGlance from './cohorts-glance.svelte';
import ComparisonChart from './comparison-chart.svelte';
import CourseDetails from './course-details.svelte';
import CoursesGlance from './courses-glance.svelte';
import ExerciseDistribution from './exercise-distribution.svelte';
import GenericChart from './generic-chart.svelte';
import GenericTable from './generic-table.svelte';
import GroupScores from './group-scores.svelte';
import HardestQuestions from './hardest-questions.svelte';
import LessonDropoff from './lesson-dropoff.svelte';
import NeedsAttention from './needs-attention.svelte';
import OverdueTable from './overdue-table.svelte';
import ScoresByCohort from './scores-by-cohort.svelte';
import ScoresByExercise from './scores-by-exercise.svelte';
import SectionScorecard from './section-scorecard.svelte';
import SectionScores from './section-scores.svelte';
import StudentGrowth from './student-growth.svelte';

const WIDGET_RENDERERS: Record<string, Component<WidgetRendererProps>> = {
  courses_summary: ComparisonChart,
  cohorts_in_course: ComparisonChart,
  course_details: CourseDetails,
  courses_at_a_glance: CoursesGlance,
  scores_by_exercise: ScoresByExercise,
  section_scores: SectionScores,
  section_scorecard: SectionScorecard,
  needs_attention: NeedsAttention,
  overdue: OverdueTable,
  hardest_questions: HardestQuestions,
  scores_by_exercise_by_cohort: ScoresByCohort,
  exercise_score_distribution: ExerciseDistribution,
  lesson_dropoff: LessonDropoff,
  cohort_details: CohortDetails,
  cohorts_at_a_glance: CohortsGlance,
  cohort_health: CohortHealth,
  avg_score_by_cohort: GroupScores,
  avg_score_by_course: GroupScores,
  hiring_ramp: StudentGrowth
};

export function rendererFor(widget: InsightsWidget): Component<WidgetRendererProps> {
  return WIDGET_RENDERERS[widget.id] ?? (widget.viz === 'table' ? GenericTable : GenericChart);
}
