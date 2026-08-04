import type { ExerciseQuestionOption } from './exercise-types';

type ThumbsQuestionShape = {
  settings?: Record<string, unknown>;
  options?: ExerciseQuestionOption[];
};

/** Strips answer-key fields from THUMBS questions (open-ended — no correct answer). */
export function normalizeThumbsQuestion<T extends ThumbsQuestionShape>(question: T): T {
  const settings = { ...(question.settings ?? {}) };
  delete settings.correctValue;

  const options = (question.options ?? []).map((option) => ({
    ...option,
    isCorrect: false
  }));

  return {
    ...question,
    settings,
    options
  };
}
