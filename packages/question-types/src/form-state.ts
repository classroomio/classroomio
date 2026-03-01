import type { ExerciseAnswerValue, ExerciseQuestionModel } from './exercise-types';

export interface ExerciseQuestionFormState {
  questions: ExerciseQuestionModel[];
  currentIndex: number;
  answers: Record<string, ExerciseAnswerValue>;
}

export function createExerciseQuestionFormState(
  initialQuestions: ExerciseQuestionModel[] = []
): ExerciseQuestionFormState {
  return {
    questions: [...initialQuestions],
    currentIndex: 0,
    answers: {}
  };
}

export function getQuestionStateKey(question: ExerciseQuestionModel, fallbackIndex: number): string {
  if (question.key) return question.key;
  if (question.id !== undefined && question.id !== null) return String(question.id);
  return String(fallbackIndex);
}
