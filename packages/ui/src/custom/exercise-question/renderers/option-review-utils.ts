/**
 * Shared helpers for MCQ-style review rows (radio, checkbox).
 */

export function getOptionNumericId(option: { id?: number | string }): number | null {
  if (option.id === undefined || option.id === null) return null;
  const n = Number(option.id);
  return Number.isNaN(n) ? null : n;
}

export function getMcqReviewRowBorderClass(isSelected: boolean, isCorrect: boolean): string {
  if (isSelected && isCorrect) {
    return 'ui:border-emerald-500 ui:bg-emerald-50/40 dark:ui:bg-emerald-950/30';
  }
  if (isSelected && !isCorrect) {
    return 'ui:border-red-500 ui:bg-red-50/40 dark:ui:bg-red-950/30';
  }
  if (!isSelected && isCorrect) {
    return 'ui:border-emerald-300 ui:bg-emerald-50/20 dark:ui:bg-emerald-950/20';
  }
  return 'ui:border-muted';
}
