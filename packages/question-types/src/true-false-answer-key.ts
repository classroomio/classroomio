export type TrueFalseAnswerOption = {
  label?: string | null;
  value?: string | number | boolean | null;
  isCorrect?: boolean;
  deletedAt?: unknown;
};

function normalizeBooleanText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function getTrueFalseOptionValue(option: TrueFalseAnswerOption): boolean | undefined {
  const normalizedValue = normalizeBooleanText(option.value);
  if (normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes') return true;
  if (normalizedValue === 'false' || normalizedValue === '0' || normalizedValue === 'no') return false;

  const normalizedLabel = normalizeBooleanText(option.label);
  if (normalizedLabel === 'true' || normalizedLabel === '1' || normalizedLabel === 'yes') return true;
  if (normalizedLabel === 'false' || normalizedLabel === '0' || normalizedLabel === 'no') return false;

  return undefined;
}

export function resolveTrueFalseCorrectValue(
  settings: Record<string, unknown> | undefined,
  options: TrueFalseAnswerOption[] | undefined,
  fallback = true
): boolean {
  if (typeof settings?.correctValue === 'boolean') return settings.correctValue;

  const correctOption = options?.find((option) => !option.deletedAt && option.isCorrect);
  const correctValue = correctOption ? getTrueFalseOptionValue(correctOption) : undefined;

  return typeof correctValue === 'boolean' ? correctValue : fallback;
}

export function syncTrueFalseOptions<T extends TrueFalseAnswerOption>(
  options: T[] | undefined,
  correctValue: boolean
): T[] {
  return (options ?? []).map((option) => {
    const optionValue = getTrueFalseOptionValue(option);
    if (typeof optionValue !== 'boolean') return option;

    return { ...option, isCorrect: optionValue === correctValue };
  });
}

export function getCanonicalTrueFalseSettings(
  settings: Record<string, unknown> | undefined,
  options: TrueFalseAnswerOption[] | undefined
): Record<string, unknown> {
  return {
    ...(settings ?? {}),
    correctValue: resolveTrueFalseCorrectValue(settings, options)
  };
}
