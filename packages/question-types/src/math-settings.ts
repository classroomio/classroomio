import type { NumericAnswerData } from './answer-data';
import { roundPoints } from './points';

export const MATH_REQUIRED_FORMS = [
  'simplified',
  'factored',
  'expanded',
  'lowest_terms',
  'rationalised_denominator'
] as const;
export type MathRequiredForm = (typeof MATH_REQUIRED_FORMS)[number];

export type NumericTolerance = {
  absoluteTolerance?: number;
  relativeTolerance?: number;
  significantFigures?: number;
};

export type MathCompare =
  | { mode: 'equivalent' }
  | { mode: 'exact_form'; form: MathRequiredForm }
  | ({ mode: 'numeric' } & NumericTolerance)
  | { mode: 'set' };

export type MathCompareMode = MathCompare['mode'];

export type MathUnitsSetting = {
  /** Expected unit as LaTeX or a plain unit symbol, e.g. `\mathrm{m}`, `m`, `km/h`. */
  unit: string;
  /** Accept the answer in another unit of the same dimension, e.g. `200 cm` for `2 m`. */
  allowConversion: boolean;
};

export type MathWrongAnswerFeedback = { answer: string; feedback: string };

export type MathExpressionSettings = {
  acceptedAnswers: string[];
  compare: MathCompare;
  units?: MathUnitsSetting;
  /** Letters treated as variables; `e`, `i` and `\pi` are constants unless listed here. */
  variables: string[];
  wrongAnswerFeedback: MathWrongAnswerFeedback[];
};

export type WorkedSolutionWorkingInput = 'typed' | 'drawing' | 'photo';

export type WorkedSolutionSettings = MathExpressionSettings & {
  answerPoints: number;
  workingInputs: WorkedSolutionWorkingInput[];
};

export type NumericSettings = {
  correctValue?: number | string;
  tolerance?: number;
  relativeTolerance?: number;
  significantFigures?: number;
};

export type MathGradeReason =
  | 'equivalent'
  | 'not_simplified'
  | 'wrong_form'
  | 'wrong_units'
  | 'wrong'
  | 'needs_review'
  | 'invalid';

export type MathGradeResult = {
  reason: MathGradeReason;
  /** The accepted answer the student's answer was matched against, when one matched. */
  matchedAnswer?: string;
  requiredForm?: MathRequiredForm;
  feedback?: string;
};

/** Grades math answers with the Compute Engine; implemented by `@cio/question-types/math-grading`. */
export interface MathGrader {
  gradeExpression(settings: MathExpressionSettings, latex: string): MathGradeResult;
  gradeNumeric(settings: NumericSettings, answer: NumericAnswerData): boolean;
}

const WORKED_SOLUTION_INPUTS: readonly WorkedSolutionWorkingInput[] = ['typed', 'drawing', 'photo'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNonNegativeNumber(value: unknown): number | undefined {
  const parsed = toFiniteNumber(value);
  return parsed !== undefined && parsed >= 0 ? parsed : undefined;
}

function toPositiveInteger(value: unknown): number | undefined {
  const parsed = toFiniteNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean);
}

function readNumericTolerance(raw: Record<string, unknown>): NumericTolerance {
  return {
    absoluteTolerance: toNonNegativeNumber(raw.absoluteTolerance),
    relativeTolerance: toNonNegativeNumber(raw.relativeTolerance),
    significantFigures: toPositiveInteger(raw.significantFigures)
  };
}

function readMathCompare(raw: unknown): MathCompare {
  if (!isRecord(raw)) return { mode: 'equivalent' };

  if (raw.mode === 'exact_form' && MATH_REQUIRED_FORMS.includes(raw.form as MathRequiredForm)) {
    return { mode: 'exact_form', form: raw.form as MathRequiredForm };
  }
  if (raw.mode === 'numeric') return { mode: 'numeric', ...readNumericTolerance(raw) };
  if (raw.mode === 'set') return { mode: 'set' };

  return { mode: 'equivalent' };
}

function readUnits(raw: unknown): MathUnitsSetting | undefined {
  if (!isRecord(raw)) return undefined;

  const unit = String(raw.unit ?? '').trim();
  if (!unit) return undefined;

  return { unit, allowConversion: raw.allowConversion === true };
}

function readWrongAnswerFeedback(raw: unknown): MathWrongAnswerFeedback[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(isRecord)
    .map((entry) => ({ answer: String(entry.answer ?? '').trim(), feedback: String(entry.feedback ?? '').trim() }))
    .filter((entry) => entry.answer && entry.feedback);
}

/** Reads `MATH_EXPRESSION` settings from stored question settings, dropping malformed entries. */
export function readMathExpressionSettings(raw: Record<string, unknown> | null | undefined): MathExpressionSettings {
  const settings = raw ?? {};

  return {
    acceptedAnswers: readStringList(settings.acceptedAnswers),
    compare: readMathCompare(settings.compare),
    units: readUnits(settings.units),
    variables: readStringList(settings.variables),
    wrongAnswerFeedback: readWrongAnswerFeedback(settings.wrongAnswerFeedback)
  };
}

/** Reads `WORKED_SOLUTION` settings; `answerPoints` defaults to half of `questionPoints` and never exceeds it. */
export function readWorkedSolutionSettings(
  raw: Record<string, unknown> | null | undefined,
  questionPoints: number
): WorkedSolutionSettings {
  const settings = raw ?? {};
  const maxPoints = Math.max(0, questionPoints);
  const requestedAnswerPoints = toNonNegativeNumber(settings.answerPoints) ?? maxPoints / 2;
  const answerPoints = roundPoints(Math.min(requestedAnswerPoints, maxPoints));
  const workingInputs = readStringList(settings.workingInputs).filter((input): input is WorkedSolutionWorkingInput =>
    WORKED_SOLUTION_INPUTS.includes(input as WorkedSolutionWorkingInput)
  );

  return {
    ...readMathExpressionSettings(settings),
    answerPoints,
    workingInputs: workingInputs.length > 0 ? workingInputs : [...WORKED_SOLUTION_INPUTS]
  };
}

/** Splits a `WORKED_SOLUTION` question's points into the auto-graded answer part and the manually graded working part. */
export function getWorkedSolutionPointSplit(
  settings: Record<string, unknown> | null | undefined,
  questionPoints: number
): { answerPoints: number; workingPoints: number } {
  const { answerPoints } = readWorkedSolutionSettings(settings, questionPoints);

  return { answerPoints, workingPoints: roundPoints(Math.max(0, questionPoints) - answerPoints) };
}

/** Reads `NUMERIC` settings; `correctValue` stays a string when it is LaTeX such as `\frac{3}{4}`. */
export function readNumericSettings(raw: Record<string, unknown> | null | undefined): NumericSettings {
  const settings = raw ?? {};
  const rawCorrect = settings.correctValue;
  const correctValue =
    typeof rawCorrect === 'number' && Number.isFinite(rawCorrect)
      ? rawCorrect
      : typeof rawCorrect === 'string' && rawCorrect.trim()
        ? rawCorrect.trim()
        : undefined;

  return {
    correctValue,
    tolerance: toNonNegativeNumber(settings.tolerance),
    relativeTolerance: toNonNegativeNumber(settings.relativeTolerance),
    significantFigures: toPositiveInteger(settings.significantFigures)
  };
}

/** Rounds `value` to `figures` significant figures. */
export function roundToSignificantFigures(value: number, figures: number): number {
  if (value === 0 || !Number.isFinite(value)) return value;

  return Number(value.toPrecision(figures));
}

/**
 * True when `answer` matches `correct`. With `significantFigures` the answer must equal `correct` rounded to that
 * many figures; otherwise it must fall within the absolute or the relative tolerance (exact match when neither is set).
 */
export function isNumericMatch(answer: number, correct: number, tolerance: NumericTolerance): boolean {
  if (!Number.isFinite(answer) || !Number.isFinite(correct)) return false;

  if (tolerance.significantFigures) {
    const rounded = roundToSignificantFigures(correct, tolerance.significantFigures);
    return Math.abs(answer - rounded) <= Math.abs(rounded) * 1e-12;
  }

  const difference = Math.abs(answer - correct);
  if (difference <= (tolerance.absoluteTolerance ?? 0)) return true;

  return difference <= (tolerance.relativeTolerance ?? 0) * Math.abs(correct);
}
