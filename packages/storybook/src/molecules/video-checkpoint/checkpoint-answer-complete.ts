function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyStrings(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;

  return value.every((item) => String(item ?? '').trim().length > 0);
}

/** Continue stays disabled until the take renderer has emitted a complete answer. */
export function isCheckpointAnswerComplete(answer: unknown): boolean {
  if (!isRecord(answer) || typeof answer.type !== 'string') return false;

  switch (answer.type) {
    case 'RADIO':
      return Number.isFinite(Number(answer.optionId));
    case 'CHECKBOX':
      return Array.isArray(answer.optionIds) && answer.optionIds.length > 0;
    case 'TRUE_FALSE':
      return typeof answer.value === 'boolean';
    case 'NUMERIC':
      return typeof answer.value === 'number' && Number.isFinite(answer.value);
    case 'FILL_BLANK':
      return nonEmptyStrings(answer.values);
    case 'WORD_BANK':
      return nonEmptyStrings(answer.filledBlanks);
    case 'ORDERING':
      return Array.isArray(answer.orderedValues) && answer.orderedValues.length > 0;
    case 'STAR':
      return typeof answer.value === 'number' && Number.isInteger(answer.value) && answer.value >= 1;
    default:
      return false;
  }
}

export function answersMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
