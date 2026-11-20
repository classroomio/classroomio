import { compareMath, parseMath, type MathVerdict } from './math-engine';

export type MathStepStatus = 'consistent' | 'inconsistent' | 'unclear' | 'unreadable';

export type MathStepCheck = { latex: string; status: MathStepStatus };

export type MathStepsCheck = {
  steps: MathStepCheck[];
  /** Zero-based index of the first step that does not follow from the one before it; null when none is wrong. */
  firstIncorrectIndex: number | null;
};

export type MathComparison = MathVerdict | 'invalid';

/** Whether two LaTeX expressions or equations mean the same thing, decided by the Compute Engine. */
export function compareMathExpressions(left: string, right: string, variables: readonly string[] = []): MathComparison {
  const parsedLeft = parseMath(left, variables);
  const parsedRight = parseMath(right, variables);
  if (!parsedLeft || !parsedRight) return 'invalid';

  return compareMath(parsedLeft.expr, parsedRight.expr, false);
}

function statusOf(comparison: MathComparison): MathStepStatus {
  if (comparison === 'equal') return 'consistent';
  if (comparison === 'different') return 'inconsistent';

  return comparison === 'disputed' ? 'unclear' : 'unreadable';
}

/**
 * Checks a student's working line by line: each line must mean the same as the last readable line before it (the first
 * line is compared with `startingExpression` when one is given). Unreadable lines are skipped, so one typo does not
 * condemn the lines after it.
 */
export function checkMathSteps(
  lines: readonly string[],
  options: { startingExpression?: string; variables?: readonly string[] } = {}
): MathStepsCheck {
  const { startingExpression, variables = [] } = options;
  let previous = startingExpression?.trim() || null;
  let firstIncorrectIndex: number | null = null;

  const steps = lines.map((rawLine, index): MathStepCheck => {
    const latex = rawLine.trim();
    if (!parseMath(latex, variables)) return { latex, status: 'unreadable' };

    const status = previous === null ? 'consistent' : statusOf(compareMathExpressions(previous, latex, variables));
    if (status === 'inconsistent' && firstIncorrectIndex === null) firstIncorrectIndex = index;

    previous = latex;
    return { latex, status };
  });

  return { steps, firstIncorrectIndex };
}
