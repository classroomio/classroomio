import type { ComputeEngine } from '@cortex-js/compute-engine';
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

let pendingComputeEngine: Promise<ComputeEngine> | null = null;

function loadComputeEngine() {
  pendingComputeEngine ??= import('@cortex-js/compute-engine').then(({ ComputeEngine }) => new ComputeEngine());

  return pendingComputeEngine;
}

/** The number a typed expression such as `\\frac{3}{4}` or `2\\sqrt{2}` evaluates to, or null when it is not a number. */
export async function latexToNumber(latex: string): Promise<number | null> {
  const trimmed = latex.trim();
  if (!trimmed) return null;

  const computeEngine = await loadComputeEngine();
  const value = computeEngine.parse(trimmed).N().re;

  return Number.isFinite(value) ? value : null;
}

/** True when student is within the absolute or relative tolerance of correct. */
export function isWithinTolerance(student: number, correct: number, settings: NumericSettings): boolean {
  const absolute = settings.tolerance ?? 0;
  const relative = (settings.relativeTolerance ?? 0) * Math.abs(correct);

  return Math.abs(student - correct) <= Math.max(absolute, relative);
}

/** The correct value as text for MathText, wrapping an expression in dollar signs. */
export function correctValueToMathText(correctValue: NumericSettings['correctValue']): string {
  if (correctValue === undefined) return '';

  return typeof correctValue === 'number' ? String(correctValue) : `$${correctValue}$`;
}
