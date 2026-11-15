import type { NumericSettings } from '@cio/question-types';

const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

/** LaTeX for the correct value, so the editor and review show a fraction or root as math. */
export function correctValueToLatex(correctValue: NumericSettings['correctValue']): string {
  return correctValue === undefined ? '' : String(correctValue);
}

/** Stores a plain number as a number, so old readers and the legacy scorer keep working, and anything else as LaTeX. */
export function latexToCorrectValue(latex: string): number | string | undefined {
  const trimmed = latex.trim();
  if (!trimmed) return undefined;

  return PLAIN_NUMBER.test(trimmed) ? Number(trimmed) : trimmed;
}

export function isPlainNumber(latex: string): boolean {
  return PLAIN_NUMBER.test(latex.trim());
}
