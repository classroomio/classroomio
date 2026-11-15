import type { Expression } from '@cortex-js/compute-engine';
import type { MathJsonExpression } from '@cortex-js/compute-engine/math-json';

import {
  compareMath,
  compareValues,
  computeEngine,
  evaluateComplex,
  operandsOf,
  parseMath,
  type ParsedMath
} from './math-engine';
import type { MathExpressionSettings, MathMisconception } from './math-settings';

const RELATION_FLIPS: Record<string, string> = {
  Less: 'Greater',
  LessEqual: 'GreaterEqual',
  Greater: 'Less',
  GreaterEqual: 'LessEqual'
};

const MATH_SEGMENT = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
const MAX_FACTOR_RATIO = 24;

function isEqual(left: Expression, right: Expression): boolean {
  return compareMath(left, right, false) === 'equal';
}

function mathSegments(text: string): string[] {
  return [...text.matchAll(MATH_SEGMENT)].map((match) => (match[1] ?? match[2]).trim()).filter(Boolean);
}

function isNode(node: MathJsonExpression): node is [string, ...MathJsonExpression[]] {
  return Array.isArray(node) && typeof node[0] === 'string';
}

function negate(node: MathJsonExpression): MathJsonExpression {
  return ['Negate', node];
}

/** Variants of a node where one product or negation was distributed onto only its first term. */
function incompleteDistributions(node: MathJsonExpression): MathJsonExpression[] {
  if (!isNode(node)) return [];

  const [operator, ...operands] = node;
  const nested = operands.flatMap((operand, index) =>
    incompleteDistributions(operand).map((variant) => [
      operator,
      ...operands.map((o, i) => (i === index ? variant : o))
    ])
  ) as MathJsonExpression[];

  if (operator === 'Negate' && operands.length === 1) {
    const [inner] = operands;
    if (isNode(inner) && inner[0] === 'Add' && inner.length > 2) {
      const [, first, ...rest] = inner;
      return [['Add', negate(first), ...rest], ...nested];
    }
  }

  if (operator === 'Multiply') {
    const sumIndex = operands.findIndex((operand) => isNode(operand) && operand[0] === 'Add' && operand.length > 2);
    if (sumIndex >= 0) {
      const sum = operands[sumIndex] as [string, ...MathJsonExpression[]];
      const others = operands.filter((_, index) => index !== sumIndex);
      const [, first, ...rest] = sum;
      return [['Add', ['Multiply', ...others, first], ...rest], ...nested];
    }
  }

  return nested;
}

function flipRelation(raw: MathJsonExpression): MathJsonExpression | null {
  if (!isNode(raw) || !(raw[0] in RELATION_FLIPS)) return null;

  const [operator, ...operands] = raw;
  return [RELATION_FLIPS[operator], ...operands];
}

function isRelationRaw(raw: MathJsonExpression): boolean {
  return isNode(raw) && ['Equal', 'Less', 'LessEqual', 'Greater', 'GreaterEqual'].includes(raw[0]);
}

function reciprocalOf(expr: Expression): Expression | null {
  try {
    return computeEngine.box(['Divide', 1, expr.json]);
  } catch {
    return null;
  }
}

function isNiceFactor(ratio: Expression): boolean {
  const value = evaluateComplex(ratio);
  if (!value || Math.abs(value.im) > 1e-9) return false;

  const magnitude = Math.abs(value.re);
  if (magnitude < 1e-9 || magnitude > 1 - 1e-9) return false;

  const factor = 1 / magnitude;
  return factor <= MAX_FACTOR_RATIO && Math.abs(factor - Math.round(factor)) < 1e-9;
}

function isDroppedFactor(student: Expression, accepted: Expression): boolean {
  if (accepted.unknowns.length === 0) return false;

  try {
    const ratio = computeEngine.box(['Divide', student.json, accepted.json]).simplify();
    if (ratio.unknowns.length === 0) return isNiceFactor(ratio);

    const [variable] = ratio.unknowns;
    return isEqual(ratio, computeEngine.box(['Divide', 1, variable]));
  } catch {
    return false;
  }
}

/** The value of an assignment such as \`x = 3\`; any other answer is returned as it is. */
function unwrapAssignment(parsed: ParsedMath): ParsedMath {
  const { raw } = parsed;
  if (!isNode(raw) || raw[0] !== 'Equal' || raw.length !== 3 || typeof raw[1] !== 'string') return parsed;

  const value = computeEngine.box(raw[2]);
  return value.unknowns.includes(raw[1]) ? parsed : { expr: value, raw: raw[2] };
}

function sourceExpressions(settings: MathExpressionSettings, title: string | undefined): ParsedMath[] {
  const sources = [...settings.acceptedAnswers, ...mathSegments(title ?? '')];
  return sources
    .map((source) => parseMath(source, settings.variables))
    .filter((parsed): parsed is ParsedMath => parsed !== null);
}

/**
 * Names the common slip behind a wrong answer: a flipped sign, an inequality that was not reversed, an inverted
 * fraction, a product that was not distributed over every term, or a dropped factor. Returns undefined when the answer
 * matches none of them, so the caller only labels answers it can explain.
 */
export function detectMisconception(
  student: ParsedMath,
  accepted: readonly ParsedMath[],
  context: { settings: MathExpressionSettings; title?: string }
): MathMisconception | undefined {
  const sources = [...accepted, ...sourceExpressions(context.settings, context.title)];
  const studentValue = unwrapAssignment(student);
  const acceptedValues = accepted.map(unwrapAssignment);

  const flipped = flipRelation(student.raw);
  if (
    flipped &&
    sources.some((source) => isRelationRaw(source.raw) && isEqual(computeEngine.box(flipped), source.expr))
  ) {
    return 'forgot_flip_inequality';
  }
  if (isRelationRaw(studentValue.raw)) return undefined;

  if (acceptedValues.some((answer) => isEqual(studentValue.expr, computeEngine.box(['Negate', answer.expr.json])))) {
    return 'sign_error';
  }

  const isDistributionSlip = sources.some((source) =>
    incompleteDistributions(source.expr.json).some((variant) => isEqual(studentValue.expr, computeEngine.box(variant)))
  );
  if (isDistributionSlip) return 'forgot_distribute';

  const isInverted = acceptedValues.some((answer) => {
    const reciprocal = reciprocalOf(answer.expr);
    return reciprocal !== null && compareValues(studentValue.expr, reciprocal) === 'equal';
  });
  if (isInverted) return 'inverted_fraction';

  if (acceptedValues.some((answer) => isDroppedFactor(studentValue.expr, answer.expr))) return 'dropped_factor';

  return undefined;
}
