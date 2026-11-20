/** Rounds a points value to the two decimals that `question_answer.point` and `submission.total` store. */
export function roundPoints(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Formats points with up to two decimals and no trailing zeros, e.g. `0.5`, `1.33`, `2`. */
export function formatPoints(value: number | string | null | undefined): string {
  return String(roundPoints(Number(value ?? 0)));
}
