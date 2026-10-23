import type { Component } from 'svelte';

import type { InsightsWidget, WidgetRendererProps } from '../../utils/types';
import CohortsGlance from './cohorts-glance.svelte';
import ExerciseDistribution from './exercise-distribution.svelte';
import GenericChart from './generic-chart.svelte';
import GenericTable from './generic-table.svelte';
import GroupSummary from './group-summary.svelte';
import HardestQuestions from './hardest-questions.svelte';
import LearnerCourses from './learner-courses.svelte';
import LearnerProgression from './learner-progression.svelte';
import OverdueTable from './overdue-table.svelte';
import ScoresByExercise from './scores-by-exercise.svelte';
import SectionScorecard from './section-scorecard.svelte';

const WIDGET_RENDERERS: Record<string, Component<WidgetRendererProps>> = {
  courses_summary: GroupSummary,
  cohorts_in_course: GroupSummary,
  cohorts_at_a_glance: CohortsGlance,
  learner_courses: LearnerCourses,
  overdue: OverdueTable,
  scores_by_exercise: ScoresByExercise,
  learner_progression: LearnerProgression,
  section_scorecard: SectionScorecard,
  hardest_questions: HardestQuestions,
  exercise_score_distribution: ExerciseDistribution
};

export function rendererFor(widget: InsightsWidget): Component<WidgetRendererProps> {
  return WIDGET_RENDERERS[widget.id] ?? (widget.viz === 'table' ? GenericTable : GenericChart);
}
