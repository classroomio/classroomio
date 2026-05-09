import type { ExerciseQuestionModel } from './exercise-types';

export type ExerciseSectionAfterAction = 'continue' | 'go_to_section' | 'submit';

export interface ExerciseSectionAfterBehavior {
  action: ExerciseSectionAfterAction;
  exerciseSectionId?: string;
}

export type ExerciseSectionDisplayMode = 'one_question' | 'all_questions';
export type ExerciseSectionColorTheme = 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate';

export interface ExerciseSectionModel {
  id?: string;
  title: string;
  description?: string | null;
  order: number;
  colorTheme: ExerciseSectionColorTheme;
  afterBehavior: ExerciseSectionAfterBehavior;
  questions: ExerciseQuestionModel[];
}
