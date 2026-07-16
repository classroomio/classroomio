import { resolveTrueFalseCorrectValue, type ExerciseQuestionOption } from '@cio/question-types';

/**
 * Matches backend scoring: settings.correctValue wins, then option correctness, then true.
 */
export function getTrueFalseCorrectIsTrue(
  settings: Record<string, unknown> | undefined,
  options: ExerciseQuestionOption[] | undefined
): boolean {
  return resolveTrueFalseCorrectValue(settings, options);
}
