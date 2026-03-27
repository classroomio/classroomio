/**
 * Matches preview/review: undefined `correctValue` defaults to true.
 */
export function getTrueFalseCorrectIsTrue(settings: Record<string, unknown> | undefined): boolean {
  return (settings?.correctValue as boolean | undefined) !== false;
}
