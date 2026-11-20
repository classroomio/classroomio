import type { MathJsonExpression } from '@cortex-js/compute-engine/math-json';

import { isNumber } from '@cortex-js/compute-engine';

import { computeEngine, operandsOf } from './math-engine';
import type { MathRequiredForm } from './math-settings';

type MathJsonNode = MathJsonExpression;

const SUM_OPERATORS = new Set(['Add', 'Subtract']);
const PRODUCT_OPERATORS = new Set(['Multiply', 'InvisibleOperator']);
const FRACTION_OPERATORS = new Set(['Divide', 'Rational']);
const RADICAL_OPERATORS = new Set(['Sqrt', 'Root']);

function isFunctionNode(node: MathJsonNode): node is [string, ...MathJsonNode[]] {
  return Array.isArray(node) && typeof node[0] === 'string';
}

function operatorOf(node: MathJsonNode): string | null {
  return isFunctionNode(node) ? node[0] : null;
}

function argumentsOf(node: MathJsonNode): MathJsonNode[] {
  return isFunctionNode(node) ? (node.slice(1) as MathJsonNode[]) : [];
}

function stripDelimiters(node: MathJsonNode): MathJsonNode {
  let current = node;
  while (operatorOf(current) === 'Delimiter' && argumentsOf(current).length >= 1) {
    const [inner] = argumentsOf(current);
    if (operatorOf(inner) === 'Sequence') return current;

    current = inner;
  }

  return current;
}

function numberValue(node: MathJsonNode): number | null {
  if (typeof node === 'number') return node;
  if (node && typeof node === 'object' && !Array.isArray(node) && 'num' in node) return Number(node.num);
  if (operatorOf(node) !== 'Negate') return null;

  const negated = numberValue(stripDelimiters(argumentsOf(node)[0]));
  return negated === null ? null : -negated;
}

function isNumericLiteral(node: MathJsonNode): boolean {
  const stripped = stripDelimiters(node);
  if (numberValue(stripped) !== null) return true;
  if (operatorOf(stripped) === 'Negate') return isNumericLiteral(argumentsOf(stripped)[0]);

  return false;
}

function isSum(node: MathJsonNode): boolean {
  return SUM_OPERATORS.has(operatorOf(stripDelimiters(node)) ?? '');
}

function walk(node: MathJsonNode, visit: (node: MathJsonNode) => boolean): boolean {
  if (visit(node)) return true;

  return argumentsOf(node).some((child) => walk(child, visit));
}

function greatestCommonDivisor(left: number, right: number): number {
  return right === 0 ? Math.abs(left) : greatestCommonDivisor(right, left % right);
}

function hasSquareFactor(value: number, rootIndex: number): boolean {
  for (let base = 2; base ** rootIndex <= value; base++) {
    if (value % base ** rootIndex === 0) return true;
  }

  return false;
}

function isReducibleIntegerFraction(node: MathJsonNode): boolean {
  if (!FRACTION_OPERATORS.has(operatorOf(node) ?? '')) return false;

  const [numerator, denominator] = argumentsOf(node).map((child) => numberValue(stripDelimiters(child)));
  if (numerator === null || denominator === null) return false;
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) return true;

  return Math.abs(denominator) === 1 || denominator < 0 || greatestCommonDivisor(numerator, denominator) > 1;
}

function canonicalJson(node: MathJsonNode): string {
  return JSON.stringify(computeEngine.box(node).json);
}

function factorsOfCanonical(node: MathJsonNode): MathJsonNode[] {
  try {
    const factored = computeEngine.box(['Factor', node]).evaluate();
    const factors = factored.operator === 'Multiply' ? operandsOf(factored) : [factored];
    return factors
      .map((factor) => (factor.operator === 'Power' ? operandsOf(factor)[0] : factor))
      .filter((factor) => factor.unknowns.length > 0)
      .map((factor) => factor.json);
  } catch {
    return [];
  }
}

function sharesFactor(numerator: MathJsonNode, denominator: MathJsonNode): boolean {
  const denominatorKeys = new Set(
    factorsOfCanonical(denominator).flatMap((factor) => [canonicalJson(factor), canonicalJson(['Negate', factor])])
  );

  return factorsOfCanonical(numerator).some((factor) => denominatorKeys.has(canonicalJson(factor)));
}

function numericContent(node: MathJsonNode): number | null {
  try {
    const factored = computeEngine.box(['Factor', node]).evaluate();
    const factors = factored.operator === 'Multiply' ? operandsOf(factored) : [factored];
    const content = factors.filter((factor) => isNumber(factor)).reduce((product, factor) => product * factor.re, 1);
    return Number.isInteger(content) ? content : null;
  } catch {
    return null;
  }
}

function isCancellableFraction(node: MathJsonNode): boolean {
  if (operatorOf(node) !== 'Divide') return false;

  const [numerator, denominator] = argumentsOf(node);
  if (computeEngine.box(denominator).unknowns.length > 0) return sharesFactor(numerator, denominator);

  const denominatorValue = numberValue(stripDelimiters(denominator));
  const content = numericContent(numerator);
  if (denominatorValue === null || content === null || !Number.isInteger(denominatorValue)) return false;

  return computeEngine.box(numerator).unknowns.length > 0 && greatestCommonDivisor(content, denominatorValue) > 1;
}

function isFactorable(sum: MathJsonNode): boolean {
  try {
    const factored = computeEngine.box(['Factor', sum]).evaluate();
    if (factored.operator === 'Power') return true;
    if (factored.operator !== 'Multiply') return false;

    const factors = operandsOf(factored);
    const numericFactors = factors.filter((factor) => factor.unknowns.length === 0);
    const isSignOnly = numericFactors.length === 1 && numericFactors[0].is(-1);

    return factors.length - numericFactors.length > 1 || (numericFactors.length > 0 && !isSignOnly);
  } catch {
    return false;
  }
}

function topLevelFactors(node: MathJsonNode): MathJsonNode[] {
  const stripped = stripDelimiters(node);
  const operator = operatorOf(stripped);
  if (operator === 'Negate') return topLevelFactors(argumentsOf(stripped)[0]);
  if (operator && PRODUCT_OPERATORS.has(operator)) return argumentsOf(stripped).flatMap(topLevelFactors);
  if (operator === 'Power') return topLevelFactors(argumentsOf(stripped)[0]);

  return [stripped];
}

function solvedSide(node: MathJsonNode): MathJsonNode {
  const stripped = stripDelimiters(node);
  if (operatorOf(stripped) !== 'Equal') return stripped;

  const [left, right] = argumentsOf(stripped);
  if (typeof left === 'string' || numberValue(left) === 0) return right;

  return numberValue(right) === 0 ? left : stripped;
}

function isFactored(node: MathJsonNode): boolean {
  return topLevelFactors(solvedSide(node))
    .filter(isSum)
    .every((factor) => !isFactorable(factor));
}

function isExpandedViolation(node: MathJsonNode): boolean {
  const operator = operatorOf(node);
  if (operator && PRODUCT_OPERATORS.has(operator)) return argumentsOf(node).some(isSum);
  if (operator === 'Negate') return isSum(argumentsOf(node)[0]);
  if (operator !== 'Power') return false;

  const [base, exponent] = argumentsOf(node);
  const exponentValue = numberValue(stripDelimiters(exponent));
  return isSum(base) && exponentValue !== null && Number.isInteger(exponentValue) && exponentValue >= 2;
}

function sumTerms(node: MathJsonNode): MathJsonNode[] {
  const stripped = stripDelimiters(node);
  const operator = operatorOf(stripped);
  if (operator === 'Add') return argumentsOf(stripped).flatMap(sumTerms);
  if (operator === 'Subtract') {
    const [first, ...rest] = argumentsOf(stripped);
    return [...sumTerms(first), ...rest.map((term): MathJsonNode => ['Negate', term])];
  }

  return [stripped];
}

function termKey(term: MathJsonNode): string {
  const canonical = computeEngine.box(term);
  if (canonical.unknowns.length === 0 && isNumber(canonical)) return '#number';

  const operands = operandsOf(canonical);
  if (canonical.operator === 'Negate') return termKey(operands[0].json);
  if (canonical.operator === 'Multiply' && isNumber(operands[0])) {
    return JSON.stringify(operands.slice(1).map((operand) => operand.json));
  }

  return JSON.stringify([canonical.json]);
}

function hasLikeTerms(node: MathJsonNode): boolean {
  const keys = sumTerms(node).map(termKey);
  return new Set(keys).size !== keys.length;
}

function productFactors(node: MathJsonNode): MathJsonNode[] {
  const stripped = stripDelimiters(node);
  const operator = operatorOf(stripped);
  if (!operator || !PRODUCT_OPERATORS.has(operator)) return [stripped];

  return argumentsOf(stripped).flatMap(productFactors);
}

function hasUncombinedFactors(node: MathJsonNode): boolean {
  const factors = argumentsOf(node).flatMap(productFactors);
  const numericFactors = factors.filter(isNumericLiteral);
  const isMixedNumber =
    operatorOf(node) === 'InvisibleOperator' &&
    factors.length === 2 &&
    numberValue(factors[0]) !== null &&
    FRACTION_OPERATORS.has(operatorOf(factors[1]) ?? '');
  if (isMixedNumber) return false;
  if (numericFactors.length > 1 || numericFactors.some((factor) => numberValue(factor) === 1)) return true;

  const baseKeys = factors
    .filter((factor) => !isNumericLiteral(factor))
    .map((factor) => canonicalJson(operatorOf(factor) === 'Power' ? argumentsOf(factor)[0] : factor));
  return new Set(baseKeys).size !== baseKeys.length;
}

function isUnsimplifiedRadical(node: MathJsonNode): boolean {
  const [radicand, index] = argumentsOf(node).map((child) => numberValue(stripDelimiters(child)));
  const rootIndex = operatorOf(node) === 'Sqrt' ? 2 : index;
  if (radicand === null || rootIndex === null || !Number.isInteger(rootIndex)) return false;
  if (!Number.isInteger(radicand) || radicand < 0) return true;

  return radicand <= 1 || hasSquareFactor(radicand, rootIndex);
}

function isSimplifiedViolation(node: MathJsonNode): boolean {
  const operator = operatorOf(node);
  if (!operator) return false;

  const children = argumentsOf(node);
  if (FRACTION_OPERATORS.has(operator)) {
    if (isReducibleIntegerFraction(node)) return true;
    if (children.some((child) => walk(child, (inner) => FRACTION_OPERATORS.has(operatorOf(inner) ?? '')))) return true;

    return isCancellableFraction(node);
  }
  if (RADICAL_OPERATORS.has(operator)) return isUnsimplifiedRadical(node);
  if (operator === 'Power') {
    const [base, exponent] = children;
    const exponentValue = numberValue(stripDelimiters(exponent));
    return exponentValue === 0 || exponentValue === 1 || (isNumericLiteral(base) && isNumericLiteral(exponent));
  }
  if (SUM_OPERATORS.has(operator)) {
    return sumTerms(node).some((term) => numberValue(stripDelimiters(term)) === 0) || hasLikeTerms(node);
  }
  if (PRODUCT_OPERATORS.has(operator)) return hasUncombinedFactors(node);

  return false;
}

function isLowestTermsViolation(node: MathJsonNode): boolean {
  if (!FRACTION_OPERATORS.has(operatorOf(node) ?? '')) return false;

  return isReducibleIntegerFraction(node) || isCancellableFraction(node);
}

function containsRadical(node: MathJsonNode): boolean {
  return walk(node, (inner) => {
    const operator = operatorOf(inner);
    if (operator && RADICAL_OPERATORS.has(operator)) return true;
    if (operator !== 'Power') return false;

    const exponent = numberValue(stripDelimiters(argumentsOf(inner)[1]));
    const isFractionalExponent = FRACTION_OPERATORS.has(operatorOf(stripDelimiters(argumentsOf(inner)[1])) ?? '');
    return isFractionalExponent || (exponent !== null && !Number.isInteger(exponent));
  });
}

function isRadicalDenominatorViolation(node: MathJsonNode): boolean {
  const operator = operatorOf(node);
  if (operator === 'Divide') return containsRadical(argumentsOf(node)[1]);
  if (operator !== 'Power') return false;

  const exponent = numberValue(stripDelimiters(argumentsOf(node)[1]));
  return exponent !== null && exponent < 0 && containsRadical(argumentsOf(node)[0]);
}

/** True when the raw (non-canonical) MathJSON of an answer is written in `form`. */
export function isInRequiredForm(raw: MathJsonExpression, form: MathRequiredForm): boolean {
  switch (form) {
    case 'expanded':
      return !walk(raw, isExpandedViolation);
    case 'factored':
      return isFactored(raw);
    case 'simplified':
      return !walk(raw, isSimplifiedViolation);
    case 'lowest_terms':
      return !walk(raw, isLowestTermsViolation);
    case 'rationalised_denominator':
      return !walk(raw, isRadicalDenominatorViolation);
  }
}
