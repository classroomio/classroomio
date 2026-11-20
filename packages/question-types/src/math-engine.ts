import { ComputeEngine, isExpression, isFunction, sym, type Expression } from '@cortex-js/compute-engine';
import type { MathJsonExpression } from '@cortex-js/compute-engine/math-json';

export const computeEngine = new ComputeEngine();

export type ParsedMath = { expr: Expression; raw: MathJsonExpression };

export type MathVerdict = 'equal' | 'different' | 'disputed';

type ComplexValue = { re: number; im: number };

const SAMPLE_COUNT = 24;
const MIN_VALID_SAMPLES = 8;
const SAMPLE_SEED = 20261113;
const RELATIVE_EPSILON = 1e-9;

const RELATION_OPERATORS = new Set(['Equal', 'NotEqual', 'Less', 'LessEqual', 'Greater', 'GreaterEqual']);
const UNORDERED_COLLECTIONS = new Set(['Set', 'Or', 'Union']);
const ORDERED_COLLECTIONS = new Set(['Tuple', 'List', 'Sequence']);
const INFINITY_SYMBOLS = new Set(['PositiveInfinity', 'NegativeInfinity', 'ComplexInfinity']);

const CONSTANT_SYMBOL_BY_VARIABLE: Record<string, string> = { e: 'e', i: 'i', pi: 'Pi', '\\pi': 'Pi', π: 'Pi' };

const MATH_DELIMITERS: Array<[string, string]> = [
  ['$$', '$$'],
  ['$', '$'],
  ['\\(', '\\)'],
  ['\\[', '\\]']
];

const MIXED_NUMBER = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;
const THOUSANDS_SEPARATED = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;

function stripMathDelimiters(latex: string): string {
  const trimmed = latex.trim();
  const delimiters = MATH_DELIMITERS.find(
    ([open, close]) =>
      trimmed.length > open.length + close.length && trimmed.startsWith(open) && trimmed.endsWith(close)
  );
  if (!delimiters) return trimmed;

  const [open, close] = delimiters;
  return trimmed.slice(open.length, trimmed.length - close.length).trim();
}

function toEngineLatex(latex: string): string {
  const source = stripMathDelimiters(latex);
  const mixedNumber = MIXED_NUMBER.exec(source);
  if (!mixedNumber) return source;

  const [, sign, whole, numerator, denominator] = mixedNumber;
  return sign + '\\left(' + whole + '+\\frac{' + numerator + '}{' + denominator + '}\\right)';
}

function variableSymbolName(constantSymbol: string): string {
  return 'Variable_' + constantSymbol;
}

function renameConstantVariables(node: MathJsonExpression, renames: ReadonlyMap<string, string>): MathJsonExpression {
  if (typeof node === 'string') return renames.get(node) ?? node;
  if (!Array.isArray(node)) return node;

  const [operator, ...operands] = node;
  return [operator, ...operands.map((child) => renameConstantVariables(child, renames))];
}

function constantRenames(variables: readonly string[]): Map<string, string> {
  const renames = new Map<string, string>();
  for (const variable of variables) {
    const constantSymbol = CONSTANT_SYMBOL_BY_VARIABLE[variable.trim()];
    if (constantSymbol) renames.set(constantSymbol, variableSymbolName(constantSymbol));
  }

  return renames;
}

/** Parses LaTeX (optionally wrapped in math delimiters) into a canonical expression; null when it is not valid math. */
export function parseMath(latex: string, variables: readonly string[] = []): ParsedMath | null {
  const source = toEngineLatex(latex);
  if (!source) return null;

  try {
    const parsed = computeEngine.parse(source, { form: 'raw' });
    if (!parsed.isValid) return null;

    const raw = renameConstantVariables(parsed.json, constantRenames(variables));
    const expr = computeEngine.box(raw);
    if (!expr.isValid) return null;

    return { expr, raw };
  } catch {
    return null;
  }
}

/** Parses a LaTeX or plain-text number such as `3/4`, `1 1/2`, `\pi`, `\sqrt{2}`, `1,000` or `3.2e4`; NaN otherwise. */
export function parseMathNumber(latex: string): number {
  const source = stripMathDelimiters(latex);
  const withoutThousands = THOUSANDS_SEPARATED.test(source) ? source.replace(/,/g, '') : source;
  const parsed = parseMath(withoutThousands);
  if (!parsed || parsed.expr.unknowns.length > 0) return Number.NaN;

  const value = evaluateComplex(parsed.expr);
  if (!value || Math.abs(value.im) > RELATIVE_EPSILON * Math.max(1, Math.abs(value.re))) return Number.NaN;

  return value.re;
}

export function evaluateComplex(expr: Expression): ComplexValue | null {
  try {
    const value = expr.N();
    const re = value.re;
    const im = value.im;
    if (typeof re !== 'number' || !Number.isFinite(re)) return null;
    if (typeof im !== 'number' || !Number.isFinite(im)) return null;

    return { re, im };
  } catch {
    return null;
  }
}

function isClose(left: ComplexValue, right: ComplexValue): boolean {
  const scale = Math.max(1, Math.hypot(left.re, left.im), Math.hypot(right.re, right.im));
  return Math.hypot(left.re - right.re, left.im - right.im) <= RELATIVE_EPSILON * scale;
}

function isNearZero(value: ComplexValue): boolean {
  return Math.hypot(value.re, value.im) <= RELATIVE_EPSILON;
}

function divideComplex(numerator: ComplexValue, denominator: ComplexValue): ComplexValue {
  const scale = denominator.re * denominator.re + denominator.im * denominator.im;
  return {
    re: (numerator.re * denominator.re + numerator.im * denominator.im) / scale,
    im: (numerator.im * denominator.re - numerator.re * denominator.im) / scale
  };
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleValue(random: () => number, pointIndex: number): number {
  const band = pointIndex % 3;
  if (band === 0) return -10 + 20 * random();
  if (band === 1) return 0.05 + 0.9 * random();

  return 1 + 24 * random();
}

/** Deterministic sample points over the real line, so grading the same answer twice gives the same result. */
function samplePoints(variables: readonly string[]): Array<Record<string, number>> {
  const random = createRandom(SAMPLE_SEED);
  return Array.from({ length: SAMPLE_COUNT }, (_, pointIndex) =>
    Object.fromEntries(variables.map((variable) => [variable, sampleValue(random, pointIndex)]))
  );
}

function unknownsOf(...expressions: Expression[]): string[] {
  return [...new Set(expressions.flatMap((expr) => [...expr.unknowns]))];
}

function isReal(value: ComplexValue): boolean {
  return Math.abs(value.im) <= RELATIVE_EPSILON * Math.max(1, Math.abs(value.re));
}

/** The value at a real sample point, or null when the point is outside the expression's real domain. */
function evaluateAt(expr: Expression, point: Record<string, number>): ComplexValue | null {
  try {
    const value = evaluateComplex(expr.subs(point));
    return value && isReal(value) ? value : null;
  } catch {
    return null;
  }
}

function sampleEquality(left: Expression, right: Expression): boolean | undefined {
  const variables = unknownsOf(left, right);
  if (variables.length === 0) {
    const leftValue = evaluateComplex(left);
    const rightValue = evaluateComplex(right);
    if (!leftValue || !rightValue) return undefined;

    return isClose(leftValue, rightValue);
  }

  let validSamples = 0;
  let domainsDiffer = false;
  for (const point of samplePoints(variables)) {
    const leftValue = evaluateAt(left, point);
    const rightValue = evaluateAt(right, point);
    if (!leftValue || !rightValue) {
      domainsDiffer ||= Boolean(leftValue) !== Boolean(rightValue);
      continue;
    }
    if (!isClose(leftValue, rightValue)) return false;

    validSamples++;
  }

  return validSamples >= MIN_VALID_SAMPLES && !domainsDiffer ? true : undefined;
}

function symbolicEquality(left: Expression, right: Expression): boolean | undefined {
  try {
    return left.isIdenticallyEqual(right);
  } catch {
    return undefined;
  }
}

function combineChecks(symbolic: boolean | undefined, sampled: boolean | undefined): MathVerdict {
  if (symbolic === undefined && sampled === undefined) return 'disputed';
  if (symbolic === undefined) return sampled ? 'equal' : 'different';
  if (sampled === undefined || sampled === symbolic) return symbolic ? 'equal' : 'different';

  return 'disputed';
}

/** Symbolic identity check first, random-point sampling second; `disputed` when they disagree or neither decides. */
export function compareValues(left: Expression, right: Expression): MathVerdict {
  return combineChecks(symbolicEquality(left, right), sampleEquality(left, right));
}

export function operandsOf(expr: Expression): Expression[] {
  return isFunction(expr) ? [...expr.ops] : [];
}

function isRelation(expr: Expression): boolean {
  return RELATION_OPERATORS.has(expr.operator) || (expr.operator === 'And' && operandsOf(expr).every(isRelation));
}

function isAssignment(expr: Expression): boolean {
  if (expr.operator !== 'Equal') return false;

  const [left, right] = operandsOf(expr);
  const variable = sym(left);
  return Boolean(variable) && !right.unknowns.includes(variable!);
}

function unwrapAssignment(expr: Expression): Expression {
  return isAssignment(expr) ? operandsOf(expr)[1] : expr;
}

function unwrapMembership(expr: Expression): Expression {
  if (expr.operator !== 'Element') return expr;

  const [element, collection] = operandsOf(expr);
  return sym(element) ? collection : expr;
}

type NormalisedRelation = { operator: 'Equal' | 'NotEqual' | 'Less' | 'LessEqual'; difference: Expression };

function difference(left: Expression, right: Expression): Expression {
  return computeEngine.box(['Subtract', left.json, right.json]);
}

function normaliseRelations(expr: Expression): NormalisedRelation[] {
  if (expr.operator === 'And') return operandsOf(expr).flatMap(normaliseRelations);

  const operands = operandsOf(expr);
  const relations: NormalisedRelation[] = [];
  for (let index = 0; index + 1 < operands.length; index++) {
    const left = operands[index];
    const right = operands[index + 1];
    if (expr.operator === 'Greater') relations.push({ operator: 'Less', difference: difference(right, left) });
    else if (expr.operator === 'GreaterEqual')
      relations.push({ operator: 'LessEqual', difference: difference(right, left) });
    else
      relations.push({
        operator: expr.operator as NormalisedRelation['operator'],
        difference: difference(left, right)
      });
  }

  return relations;
}

function symbolicRatio(left: Expression, right: Expression, requirePositive: boolean): boolean | undefined {
  try {
    const ratio = computeEngine.box(['Divide', left.json, right.json]).simplify();
    if (ratio.unknowns.length > 0) return undefined;

    const value = evaluateComplex(ratio);
    if (!value || isNearZero(value) || Math.abs(value.im) > RELATIVE_EPSILON) return undefined;

    return !requirePositive || value.re > 0;
  } catch {
    return undefined;
  }
}

type SampledRatio = 'constant' | 'same_sign' | 'varying' | 'different' | undefined;

/**
 * How the student's relation (left) relates to the accepted one (right) at sample points: `constant` when one is an
 * allowed constant multiple of the other, `same_sign` when the multiplier varies but keeps an allowed sign, `varying`
 * when it changes sign, `different` when only one side vanishes somewhere or the constant has the wrong sign.
 */
function sampledRatio(left: Expression, right: Expression, requirePositive: boolean): SampledRatio {
  const variables = unknownsOf(left, right);
  const points = variables.length > 0 ? samplePoints(variables) : [{}];
  const ratios: number[] = [];
  let validSamples = 0;

  for (const point of points) {
    const leftValue = evaluateAt(left, point);
    const rightValue = evaluateAt(right, point);
    if (!leftValue || !rightValue) continue;

    validSamples++;
    if (isNearZero(rightValue) || isNearZero(leftValue)) {
      if (isNearZero(rightValue) !== isNearZero(leftValue)) return 'different';
      continue;
    }

    ratios.push(leftValue.re / rightValue.re);
  }

  if (ratios.length === 0) return validSamples > 0 && variables.length === 0 ? 'constant' : undefined;
  if (variables.length > 0 && validSamples < MIN_VALID_SAMPLES) return undefined;

  const isPositive = ratios[0] > 0;
  const keepsSign = ratios.every((ratio) => ratio > 0 === isPositive);
  if (!keepsSign) return 'varying';
  if (requirePositive && !isPositive) return 'different';

  const reference = { re: ratios[0], im: 0 };
  return ratios.every((ratio) => isClose({ re: ratio, im: 0 }, reference)) ? 'constant' : 'same_sign';
}

function solveFor(difference: Expression, variable: string): Expression[] {
  try {
    const solutions = computeEngine.box(['Equal', difference.json, 0]).solve([variable]);
    if (!Array.isArray(solutions)) return [];

    const expressions = (solutions as unknown[]).filter((solution): solution is Expression => isExpression(solution));
    return expressions.filter((solution) => !solution.unknowns.includes(variable));
  } catch {
    return [];
  }
}

/** True when `difference` vanishes at every sampled point of every solution of `source`; undefined when nothing solves. */
function vanishesOnSolutions(difference: Expression, source: Expression): boolean | undefined {
  let checkedPoints = 0;
  for (const variable of source.unknowns) {
    for (const solution of solveFor(source, variable)) {
      const restricted = difference.subs({ [variable]: solution });
      const otherVariables = unknownsOf(restricted, solution);
      const points = otherVariables.length > 0 ? samplePoints(otherVariables) : [{}];
      for (const point of points) {
        const value = evaluateAt(restricted, point);
        if (!value) continue;
        if (!isNearZero(value)) return false;

        checkedPoints++;
      }
    }
  }

  return checkedPoints > 0 ? true : undefined;
}

function compareSolutionSets(student: Expression, accepted: Expression): MathVerdict {
  const studentHoldsOnAccepted = vanishesOnSolutions(student, accepted);
  if (studentHoldsOnAccepted === false) return 'different';

  const acceptedHoldsOnStudent = vanishesOnSolutions(accepted, student);
  if (acceptedHoldsOnStudent === false) return 'different';

  return studentHoldsOnAccepted && acceptedHoldsOnStudent ? 'equal' : 'disputed';
}

function compareRelation(student: NormalisedRelation, accepted: NormalisedRelation): MathVerdict {
  if (student.operator !== accepted.operator) return 'different';

  const requirePositive = student.operator === 'Less' || student.operator === 'LessEqual';
  const sampled = sampledRatio(student.difference, accepted.difference, requirePositive);
  if (sampled === 'different') return 'different';
  if (sampled !== 'constant' && student.operator === 'Equal') {
    return compareSolutionSets(student.difference, accepted.difference);
  }
  if (sampled === 'same_sign') return 'disputed';

  return combineChecks(
    symbolicRatio(student.difference, accepted.difference, requirePositive),
    sampled === undefined ? undefined : sampled === 'constant'
  );
}

function matchUnordered<T>(
  students: T[],
  accepted: T[],
  compare: (student: T, accepted: T) => MathVerdict
): MathVerdict {
  if (students.length !== accepted.length) return 'different';

  const verdicts = students.map((student) => accepted.map((candidate) => compare(student, candidate)));
  const used = new Set<number>();

  function assign(studentIndex: number, allowDisputed: boolean): boolean {
    if (studentIndex === students.length) return true;

    for (let acceptedIndex = 0; acceptedIndex < accepted.length; acceptedIndex++) {
      if (used.has(acceptedIndex)) continue;

      const verdict = verdicts[studentIndex][acceptedIndex];
      if (verdict === 'different' || (verdict === 'disputed' && !allowDisputed)) continue;

      used.add(acceptedIndex);
      if (assign(studentIndex + 1, allowDisputed)) return true;
      used.delete(acceptedIndex);
    }

    return false;
  }

  if (assign(0, false)) return 'equal';

  used.clear();
  return assign(0, true) ? 'disputed' : 'different';
}

function matchOrdered<T>(students: T[], accepted: T[], compare: (student: T, accepted: T) => MathVerdict): MathVerdict {
  if (students.length !== accepted.length) return 'different';

  const verdicts = students.map((student, index) => compare(student, accepted[index]));
  if (verdicts.includes('different')) return 'different';

  return verdicts.includes('disputed') ? 'disputed' : 'equal';
}

function isInfinitySymbol(expr: Expression): boolean {
  return INFINITY_SYMBOLS.has(sym(expr) ?? '') || (expr.operator === 'Negate' && isInfinitySymbol(operandsOf(expr)[0]));
}

type IntervalBound = { value: Expression; open: boolean };

function intervalBounds(expr: Expression): [IntervalBound, IntervalBound] | null {
  if (expr.operator !== 'Interval') return null;

  const bounds = operandsOf(expr).map((bound) =>
    bound.operator === 'Open' ? { value: operandsOf(bound)[0], open: true } : { value: bound, open: false }
  );
  if (bounds.length !== 2) return null;

  return [bounds[0], bounds[1]];
}

function compareBound(student: IntervalBound, accepted: IntervalBound): MathVerdict {
  if (isInfinitySymbol(student.value) || isInfinitySymbol(accepted.value)) {
    return student.value.isSame(accepted.value) ? 'equal' : 'different';
  }
  if (student.open !== accepted.open) return 'different';

  return compareValues(student.value, accepted.value);
}

function relationToInterval(expr: Expression): Expression {
  const relations = expr.operator === 'And' ? operandsOf(expr) : [expr];
  const variables = unknownsOf(expr);
  if (variables.length !== 1 || !relations.every((relation) => RELATION_OPERATORS.has(relation.operator))) return expr;

  let lower: MathJsonExpression = ['Open', 'NegativeInfinity'];
  let upper: MathJsonExpression = ['Open', 'PositiveInfinity'];
  for (const relation of relations) {
    const operands = operandsOf(relation);
    const isLessFamily = relation.operator === 'Less' || relation.operator === 'LessEqual';
    const isGreaterFamily = relation.operator === 'Greater' || relation.operator === 'GreaterEqual';
    if (!isLessFamily && !isGreaterFamily) return expr;

    const ascending = isLessFamily ? operands : [...operands].reverse();
    const open = relation.operator === 'Less' || relation.operator === 'Greater';
    const variableIndex = ascending.findIndex((operand) => sym(operand) === variables[0]);
    if (variableIndex < 0) return expr;

    if (variableIndex > 0) {
      const bound = ascending[variableIndex - 1].json;
      lower = open ? ['Open', bound] : bound;
    }
    if (variableIndex < ascending.length - 1) {
      const bound = ascending[variableIndex + 1].json;
      upper = open ? ['Open', bound] : bound;
    }
  }

  return computeEngine.box(['Interval', lower, upper]);
}

function plusMinusElements(expr: Expression): Expression[] {
  const value = unwrapAssignment(expr);
  if (value.operator !== 'Measurement') return [value];

  const [centre, spread] = operandsOf(value);
  return [
    computeEngine.box(['Add', centre.json, spread.json]),
    computeEngine.box(['Subtract', centre.json, spread.json])
  ];
}

function collectionElements(expr: Expression): Expression[] {
  const unwrapped = unwrapMembership(expr);
  const isCollection = UNORDERED_COLLECTIONS.has(unwrapped.operator) || ORDERED_COLLECTIONS.has(unwrapped.operator);
  const elements = isCollection ? operandsOf(unwrapped) : [unwrapped];

  return elements
    .flatMap(plusMinusElements)
    .map((element) => (isRelation(element) ? relationToInterval(element) : element));
}

function isCollectionLike(expr: Expression): boolean {
  const unwrapped = unwrapMembership(expr);
  return (
    UNORDERED_COLLECTIONS.has(unwrapped.operator) ||
    ORDERED_COLLECTIONS.has(unwrapped.operator) ||
    unwrapped.operator === 'Interval' ||
    unwrapped.operator === 'Element' ||
    plusMinusElements(unwrapped).length > 1
  );
}

function isOrderedCollection(expr: Expression): boolean {
  return ORDERED_COLLECTIONS.has(unwrapMembership(expr).operator);
}

function isIntervalLike(expr: Expression): boolean {
  const unwrapped = unwrapMembership(expr);
  return unwrapped.operator === 'Interval' || unwrapped.operator === 'Union';
}

/** Reads relations as intervals and, when `coercePairs` is set, `(a, b)` as an open and `[a, b]` as a closed interval. */
function asInterval(expr: Expression, coercePairs: boolean): Expression {
  if (isRelation(expr)) return relationToInterval(expr);

  const unwrapped = unwrapMembership(expr);
  const operands = operandsOf(unwrapped);
  if (!coercePairs || operands.length !== 2) return unwrapped;

  const [lower, upper] = operands.map((operand) => operand.json);
  if (unwrapped.operator === 'Tuple') return computeEngine.box(['Interval', ['Open', lower], ['Open', upper]]);
  if (unwrapped.operator === 'List') return computeEngine.box(['Interval', lower, upper]);

  return unwrapped;
}

function compareIntervals(student: Expression, accepted: Expression): MathVerdict | null {
  const studentBounds = intervalBounds(student);
  const acceptedBounds = intervalBounds(accepted);
  if (!studentBounds && !acceptedBounds) return null;
  if (!studentBounds || !acceptedBounds) return 'different';

  return matchOrdered(studentBounds, acceptedBounds, compareBound);
}

/**
 * Compares a student's expression with an accepted one: values, equations (up to a constant factor), inequalities
 * (up to a positive factor), intervals and collections. In set mode every collection is order-independent.
 */
export function compareMath(student: Expression, accepted: Expression, setMode: boolean): MathVerdict {
  if (isCollectionLike(student) || isCollectionLike(accepted)) {
    const coercePairs = [student, accepted].some((expr) => isRelation(expr) || isIntervalLike(expr));
    const intervalVerdict = compareIntervals(asInterval(student, coercePairs), asInterval(accepted, coercePairs));
    if (intervalVerdict) return intervalVerdict;

    const ordered = !setMode && isOrderedCollection(student) && isOrderedCollection(accepted);
    const compareElement = (left: Expression, right: Expression) => compareMath(left, right, setMode);
    return ordered
      ? matchOrdered(collectionElements(student), collectionElements(accepted), compareElement)
      : matchUnordered(collectionElements(student), collectionElements(accepted), compareElement);
  }

  if (isRelation(student) && isRelation(accepted)) {
    const intervalVerdict = compareIntervals(relationToInterval(student), relationToInterval(accepted));
    if (intervalVerdict === 'equal') return intervalVerdict;

    return matchUnordered(normaliseRelations(student), normaliseRelations(accepted), compareRelation);
  }

  const studentValue = unwrapAssignment(student);
  const acceptedValue = unwrapAssignment(accepted);
  if (isRelation(studentValue) || isRelation(acceptedValue)) return 'different';

  return compareValues(studentValue, acceptedValue);
}

/** Canonical MathJSON of an answer as a string, so equal answers written differently group together; null when invalid. */
export function normaliseMathAnswer(latex: string, variables: readonly string[] = []): string | null {
  const parsed = parseMath(latex, variables);
  return parsed ? JSON.stringify(parsed.expr.json) : null;
}
