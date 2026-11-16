import { evaluateComplex, parseMath } from './math-engine';

const FUNCTION_PREFIX = /^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/;
const REAL_EPSILON = 1e-9;

/**
 * Turns a LaTeX function of x such as `x^2-4` or `y=\sin(x)` into a plain JavaScript function for drawing; returns
 * null when it is not valid math. The function returns NaN where the value is undefined or not a real number.
 */
export function compileGraphFunction(latex: string): ((x: number) => number) | null {
  const parsed = parseMath(latex.replace(FUNCTION_PREFIX, ''), ['x']);
  if (!parsed) return null;

  return (x) => {
    const value = evaluateComplex(parsed.expr.subs({ x }));
    if (!value || Math.abs(value.im) > REAL_EPSILON * Math.max(1, Math.abs(value.re))) return Number.NaN;

    return value.re;
  };
}
