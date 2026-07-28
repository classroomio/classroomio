import type { ExerciseQuestionOption } from '@cio/question-types';

export function findThumbsOption(
  options: ExerciseQuestionOption[] | undefined,
  value: boolean
): ExerciseQuestionOption | undefined {
  const wanted = value ? 'true' : 'false';

  return (options ?? []).find((item) => {
    if (item.deletedAt) return false;

    return (
      String(item.value ?? '')
        .trim()
        .toLowerCase() === wanted
    );
  });
}

export function getThumbsOptionLabel(
  options: ExerciseQuestionOption[] | undefined,
  value: boolean,
  fallbackYes: string,
  fallbackNo: string
): string {
  const option = findThumbsOption(options, value);
  const fallback = value ? fallbackYes : fallbackNo;
  const label = option?.label?.trim();

  return label || fallback;
}
