import { isNumber, type Expression } from '@cortex-js/compute-engine';

import type { NumericAnswerData } from './answer-data';
import {
  compareMath,
  computeEngine,
  evaluateComplex,
  operandsOf,
  parseMath,
  parseMathNumber,
  type MathVerdict,
  type ParsedMath
} from './math-engine';
import { isInRequiredForm } from './math-forms';
import {
  isNumericMatch,
  type MathCompare,
  type MathExpressionSettings,
  type MathGradeReason,
  type MathGradeResult,
  type MathGrader,
  type MathRequiredForm,
  type MathUnitsSetting,
  type NumericSettings,
  type NumericTolerance
} from './math-settings';

export { normaliseMathAnswer, parseMathNumber } from './math-engine';

type Comparison = Exclude<MathGradeReason, 'not_simplified' | 'wrong_form' | 'invalid'>;

const DEFAULT_NUMERIC_TOLERANCE: NumericTolerance = { relativeTolerance: 1e-9 };
const SIMPLIFICATION_FORMS: ReadonlySet<MathRequiredForm> = new Set([
  'simplified',
  'lowest_terms',
  'rationalised_denominator'
]);
const REASON_RANK: Record<MathGradeReason, number> = {
  equivalent: 0,
  not_simplified: 1,
  wrong_form: 1,
  wrong_units: 2,
  needs_review: 3,
  wrong: 4,
  invalid: 5
};

function verdictToComparison(verdict: MathVerdict): Comparison {
  if (verdict === 'equal') return 'equivalent';

  return verdict === 'disputed' ? 'needs_review' : 'wrong';
}

function numericValue(expr: Expression): number | null {
  if (expr.unknowns.length > 0) return null;

  const value = evaluateComplex(expr);
  return value && Math.abs(value.im) <= 1e-12 ? value.re : null;
}

function withDefaultTolerance(compare: NumericTolerance): NumericTolerance {
  const hasTolerance =
    compare.absoluteTolerance !== undefined ||
    compare.relativeTolerance !== undefined ||
    compare.significantFigures !== undefined;
  return hasTolerance ? compare : DEFAULT_NUMERIC_TOLERANCE;
}

function compareByMode(student: Expression, accepted: Expression, compare: MathCompare): Comparison {
  if (compare.mode === 'numeric') {
    const studentValue = numericValue(student);
    const acceptedValue = numericValue(accepted);
    if (studentValue !== null && acceptedValue !== null) {
      return isNumericMatch(studentValue, acceptedValue, withDefaultTolerance(compare)) ? 'equivalent' : 'wrong';
    }
  }

  return verdictToComparison(compareMath(student, accepted, compare.mode === 'set'));
}

type SplitQuantity = { magnitude: Expression; unit: Expression | null };

function splitQuantity(expr: Expression): SplitQuantity {
  if (expr.operator !== 'Quantity') return { magnitude: expr, unit: null };

  const [magnitude, unit] = operandsOf(expr);
  return { magnitude, unit };
}

function parseUnit(unit: string): Expression | null {
  const latex = unit.includes('\\') ? '1\\,' + unit : '1\\,\\mathrm{' + unit + '}';
  const parsed = parseMath(latex);
  if (!parsed || parsed.expr.operator !== 'Quantity') return null;

  return splitQuantity(parsed.expr).unit;
}

function unitScale(from: Expression, to: Expression): number | null {
  if (from.isSame(to)) return 1;

  const ratio = computeEngine.box(['Divide', ['Quantity', 1, from.json], ['Quantity', 1, to.json]]).N();
  if (!isNumber(ratio)) return null;

  const scale = ratio.re;
  return typeof scale === 'number' && Number.isFinite(scale) && scale !== 0 ? scale : null;
}

function inUnit(quantity: SplitQuantity, unit: Expression): Expression | null {
  if (!quantity.unit) return quantity.magnitude;

  const scale = unitScale(quantity.unit, unit);
  return scale === null ? null : computeEngine.box(['Multiply', scale, quantity.magnitude.json]);
}

function compareWithUnits(
  student: Expression,
  accepted: Expression,
  compare: MathCompare,
  units: MathUnitsSetting
): Comparison {
  const expectedUnit = parseUnit(units.unit);
  if (!expectedUnit) return 'needs_review';

  const acceptedMagnitude = inUnit(splitQuantity(accepted), expectedUnit);
  if (!acceptedMagnitude) return 'needs_review';

  const studentQuantity = splitQuantity(student);
  const isSameUnit = studentQuantity.unit !== null && studentQuantity.unit.isSame(expectedUnit);
  const convertedMagnitude = studentQuantity.unit ? inUnit(studentQuantity, expectedUnit) : null;
  const unitAccepted = isSameUnit || (units.allowConversion && convertedMagnitude !== null);
  const magnitude = convertedMagnitude ?? studentQuantity.magnitude;
  const comparison = compareByMode(magnitude, acceptedMagnitude, compare);

  if (comparison === 'equivalent' && !unitAccepted) return 'wrong_units';

  return comparison;
}

function gradeAgainst(student: ParsedMath, accepted: ParsedMath, settings: MathExpressionSettings): MathGradeResult {
  const comparison = settings.units
    ? compareWithUnits(student.expr, accepted.expr, settings.compare, settings.units)
    : compareByMode(student.expr, accepted.expr, settings.compare);
  if (comparison !== 'equivalent' || settings.compare.mode !== 'exact_form') return { reason: comparison };

  const requiredForm = settings.compare.form;
  if (isInRequiredForm(student.raw, requiredForm)) return { reason: 'equivalent' };

  return { reason: SIMPLIFICATION_FORMS.has(requiredForm) ? 'not_simplified' : 'wrong_form', requiredForm };
}

function matchWrongAnswerFeedback(student: ParsedMath, settings: MathExpressionSettings): string | undefined {
  const setMode = settings.compare.mode === 'set';
  const match = settings.wrongAnswerFeedback.find((entry) => {
    const known = parseMath(entry.answer, settings.variables);
    return known !== null && compareMath(student.expr, known.expr, setMode) === 'equal';
  });

  return match?.feedback;
}

/**
 * Grades a LaTeX answer to a `MATH_EXPRESSION` question against every accepted answer and returns the best outcome,
 * with the teacher's wrong-answer feedback when the answer matches a known wrong answer.
 */
export function scoreMathExpression(settings: MathExpressionSettings, latex: string): MathGradeResult {
  const student = parseMath(latex, settings.variables);
  if (!student) return { reason: 'invalid' };

  let best: MathGradeResult = { reason: 'wrong' };
  for (const acceptedLatex of settings.acceptedAnswers) {
    const accepted = parseMath(acceptedLatex, settings.variables);
    if (!accepted) continue;

    const result = { ...gradeAgainst(student, accepted, settings), matchedAnswer: acceptedLatex };
    if (REASON_RANK[result.reason] < REASON_RANK[best.reason]) best = result;
    if (best.reason === 'equivalent') return best;
  }

  const feedback = matchWrongAnswerFeedback(student, settings);
  const { matchedAnswer, ...withoutMatch } = best;
  const result = best.reason === 'wrong' ? withoutMatch : { ...withoutMatch, matchedAnswer };

  return feedback ? { ...result, feedback } : result;
}

function resolveCorrectValue(correctValue: NumericSettings['correctValue']): number {
  if (typeof correctValue === 'number') return correctValue;
  if (typeof correctValue !== 'string') return Number.NaN;

  const plain = Number(correctValue);
  return Number.isFinite(plain) ? plain : parseMathNumber(correctValue);
}

/** Grades a `NUMERIC` answer, reading LaTeX (`3/4`, `1 1/2`, `\pi`, `\sqrt{2}`, `3.2\times10^4`) when it is present. */
export function scoreNumericAnswer(settings: NumericSettings, answer: NumericAnswerData): boolean {
  const correct = resolveCorrectValue(settings.correctValue);
  const value = answer.latex?.trim() ? parseMathNumber(answer.latex) : answer.value;

  return isNumericMatch(value, correct, {
    absoluteTolerance: settings.tolerance,
    relativeTolerance: settings.relativeTolerance,
    significantFigures: settings.significantFigures
  });
}

/** The Compute Engine grader to pass to `scoreAnswerForQuestion` / `scoreSubmissionAnswers`. */
export const mathGrader: MathGrader = {
  gradeExpression: scoreMathExpression,
  gradeNumeric: scoreNumericAnswer
};
