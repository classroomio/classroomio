import { sym, type Expression } from '@cortex-js/compute-engine';

import { QUESTION_TYPE_KEY } from './question-type-keys';
import { QUESTION_TYPE_IDS } from './question-type-registry';
import { compareMath, computeEngine, evaluateComplex, operandsOf, parseMath, parseMathNumber } from './math-engine';
import { scoreMathExpression } from './math-grading';
import {
  isNumericMatch,
  readMathExpressionSettings,
  readNumericSettings,
  type MathExpressionSettings
} from './math-settings';

/**
 * What the author states beside an answer key so the engine can confirm it: `expression` is the problem's own
 * expression (for example `\\frac{1}{2}+\\frac{1}{3}`) whose value must equal the key, and `equation` is an equation
 * whose solution the key must satisfy (for example `2x+3=11` with the key `x=4`).
 */
export type AnswerKeyVerification = { expression?: string; equation?: string };

export type AnswerKeyInput = {
  questionTypeId: number;
  title?: string;
  points?: number;
  settings?: Record<string, unknown> | null;
  optionLabels?: readonly string[];
  verify?: AnswerKeyVerification;
};

const MATH_TYPE_IDS = new Set<number>([
  QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.MATH_EXPRESSION],
  QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.WORKED_SOLUTION]
]);
const NUMERIC_TYPE_ID: number = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.NUMERIC];
const WORKED_SOLUTION_TYPE_ID: number = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.WORKED_SOLUTION];
const RESIDUAL_EPSILON = 1e-7;
const ENUMERATING_OPERATORS = new Set(['Or', 'And', 'Set', 'List', 'Tuple', 'Sequence']);

function hasBalancedDollars(text: string): boolean {
  const unescaped = text.replace(/\\\$/g, '');
  const doubles = unescaped.match(/\$\$/g)?.length ?? 0;
  const singles = (unescaped.match(/\$/g)?.length ?? 0) - doubles * 2;

  return singles % 2 === 0;
}

function numericValueOf(expr: Expression): number | null {
  if (expr.unknowns.length > 0) return null;

  const value = evaluateComplex(expr);
  return value && Math.abs(value.im) <= RESIDUAL_EPSILON ? value.re : null;
}

function flattenAnswers(expr: Expression): Expression[] {
  return ENUMERATING_OPERATORS.has(expr.operator) ? operandsOf(expr).flatMap(flattenAnswers) : [expr];
}

type Assignment = { variable: string; value: Expression };

function toAssignment(expr: Expression): Assignment | null {
  if (expr.operator !== 'Equal') return null;

  const [left, right] = operandsOf(expr);
  const variable = left ? sym(left) : null;
  if (!variable || !right || right.unknowns.includes(variable)) return null;

  return { variable, value: right };
}

function equationResidual(equation: Expression, assignment: Assignment): number | null {
  if (equation.operator !== 'Equal') return null;

  const [left, right] = operandsOf(equation);
  const difference = computeEngine
    .box(['Subtract', left.json, right.json])
    .subs({ [assignment.variable]: assignment.value });
  const value = evaluateComplex(difference);

  return value ? Math.hypot(value.re, value.im) : null;
}

function verifyEquation(equationLatex: string, answers: readonly string[], variables: readonly string[]): string[] {
  const equation = parseMath(equationLatex, variables);
  if (!equation || equation.expr.operator !== 'Equal') {
    return ['verify.equation "' + equationLatex + '" is not a valid equation.'];
  }

  const assignments = answers.flatMap((answer) => {
    const parsed = parseMath(answer, variables);
    return parsed
      ? flattenAnswers(parsed.expr)
          .map(toAssignment)
          .filter((entry) => entry !== null)
      : [];
  });
  if (assignments.length === 0) {
    return ['verify.equation needs an answer of the form x = value so the engine can substitute it.'];
  }

  const failures = assignments.filter((assignment) => {
    const residual = equationResidual(equation.expr, assignment);
    return residual === null || residual > RESIDUAL_EPSILON;
  });

  return failures.map(
    (assignment) =>
      'The key ' +
      assignment.variable +
      ' = ' +
      JSON.stringify(assignment.value.json) +
      ' does not satisfy "' +
      equationLatex +
      '".'
  );
}

function verifyMathExpression(settings: MathExpressionSettings, verify: AnswerKeyVerification | undefined): string[] {
  if (settings.acceptedAnswers.length === 0) return ['Add at least one accepted answer in settings.acceptedAnswers.'];

  const issues: string[] = [];
  const parsed = settings.acceptedAnswers.map((answer) => ({ answer, parsed: parseMath(answer, settings.variables) }));
  for (const { answer, parsed: result } of parsed) {
    if (!result) issues.push('Accepted answer "' + answer + '" is not valid LaTeX math.');
  }

  for (const entry of settings.wrongAnswerFeedback) {
    const known = parseMath(entry.answer, settings.variables);
    if (!known) {
      issues.push('wrongAnswerFeedback answer "' + entry.answer + '" is not valid LaTeX math.');
      continue;
    }

    const acceptedMatch = parsed.find(
      ({ parsed: result }) =>
        result && compareMath(known.expr, result.expr, settings.compare.mode === 'set') === 'equal'
    );
    if (acceptedMatch) {
      issues.push(
        'wrongAnswerFeedback answer "' +
          entry.answer +
          '" is equivalent to the accepted answer "' +
          acceptedMatch.answer +
          '".'
      );
    }
  }
  if (issues.length > 0 || !verify) return issues;

  if (verify.expression) {
    const compare = settings.compare.mode === 'numeric' ? settings.compare : { mode: 'equivalent' as const };
    const result = scoreMathExpression(
      { ...settings, compare, units: undefined, wrongAnswerFeedback: [] },
      verify.expression
    );
    if (result.reason === 'invalid')
      issues.push('verify.expression "' + verify.expression + '" is not valid LaTeX math.');
    else if (result.reason === 'needs_review') {
      issues.push(
        'The engine could not decide whether verify.expression equals the key; restate it in a simpler form.'
      );
    } else if (result.reason !== 'equivalent') {
      issues.push(
        'verify.expression "' +
          verify.expression +
          '" does not equal the accepted answer "' +
          settings.acceptedAnswers[0] +
          '".'
      );
    }
  }
  if (verify.equation) issues.push(...verifyEquation(verify.equation, settings.acceptedAnswers, settings.variables));

  return issues;
}

function verifyNumeric(
  settings: Record<string, unknown> | null | undefined,
  verify: AnswerKeyVerification | undefined
): string[] {
  const numeric = readNumericSettings(settings);
  if (numeric.correctValue === undefined) return ['Set settings.correctValue to a number or LaTeX value.'];

  const correct =
    typeof numeric.correctValue === 'number' ? numeric.correctValue : parseMathNumber(numeric.correctValue);
  if (!Number.isFinite(correct)) return ['settings.correctValue "' + numeric.correctValue + '" is not a valid number.'];
  if (!verify) return [];

  const issues: string[] = [];
  if (verify.expression) {
    const value = parseMathNumber(verify.expression);
    const hasTolerance =
      numeric.tolerance !== undefined ||
      numeric.relativeTolerance !== undefined ||
      numeric.significantFigures !== undefined;
    const tolerance = {
      absoluteTolerance: numeric.tolerance,
      relativeTolerance: hasTolerance ? numeric.relativeTolerance : 1e-9,
      significantFigures: numeric.significantFigures
    };
    if (!Number.isFinite(value)) {
      issues.push('verify.expression "' + verify.expression + '" is not a constant numeric expression.');
    } else if (!isNumericMatch(correct, value, tolerance)) {
      issues.push(
        'verify.expression "' + verify.expression + '" evaluates to ' + value + ', not the key ' + correct + '.'
      );
    }
  }
  if (verify.equation) {
    const equation = parseMath(verify.equation);
    const variable = equation?.expr.unknowns.length === 1 ? equation.expr.unknowns[0] : undefined;
    if (!equation || equation.expr.operator !== 'Equal' || !variable) {
      issues.push('verify.equation must be an equation in exactly one variable.');
    } else {
      const residual = equationResidual(equation.expr, { variable, value: computeEngine.number(correct) });
      if (residual === null || residual > RESIDUAL_EPSILON * Math.max(1, Math.abs(correct))) {
        issues.push('The key ' + correct + ' does not satisfy "' + verify.equation + '".');
      }
    }
  }

  return issues;
}

/**
 * Checks an answer key before the question is saved. Math keys (`MATH_EXPRESSION`, `WORKED_SOLUTION`, `NUMERIC`) must
 * parse and, when `verify` is given, agree with the author's own expression or equation under the Compute Engine.
 * Any `$` math in the title or options must be balanced. Returns one readable message per problem; empty means the
 * key is safe to store.
 */
export function verifyAnswerKey(question: AnswerKeyInput): string[] {
  const issues: string[] = [];
  const texts = [question.title ?? '', ...(question.optionLabels ?? [])];
  if (!texts.every(hasBalancedDollars)) {
    issues.push('A "$" math delimiter in the question text or an option is not closed.');
  }

  const isMath = MATH_TYPE_IDS.has(question.questionTypeId);
  const isNumeric = question.questionTypeId === NUMERIC_TYPE_ID;
  if (question.verify && !isMath && !isNumeric) {
    issues.push('verify only applies to NUMERIC, MATH_EXPRESSION and WORKED_SOLUTION questions.');
  }

  if (isMath) {
    issues.push(...verifyMathExpression(readMathExpressionSettings(question.settings), question.verify));
    const answerPoints = question.settings?.answerPoints;
    if (
      question.questionTypeId === WORKED_SOLUTION_TYPE_ID &&
      typeof answerPoints === 'number' &&
      question.points !== undefined
    ) {
      if (answerPoints > question.points) issues.push('settings.answerPoints cannot exceed the question points.');
    }
  }
  if (isNumeric) issues.push(...verifyNumeric(question.settings, question.verify));

  return issues;
}

/** Formats the issues of several questions into one message the agent can act on; null when every key is fine. */
export function formatAnswerKeyIssues(questions: readonly (AnswerKeyInput & { label?: string })[]): string | null {
  const lines = questions.flatMap((question, index) =>
    verifyAnswerKey(question).map((issue) => '- Question ' + (question.label ?? String(index + 1)) + ': ' + issue)
  );
  if (lines.length === 0) return null;

  return (
    'The answer key failed verification, so nothing was saved. Fix these and call the tool again:\n' + lines.join('\n')
  );
}
