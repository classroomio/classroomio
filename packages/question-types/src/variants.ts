import { isExpression, type Expression } from '@cortex-js/compute-engine';

import { computeEngine, evaluateComplex } from './math-engine';
import {
  createSeededRandom,
  drawVariableValues,
  readQuestionParameters,
  type QuestionParameters
} from './variant-settings';

export type VariantQuestion = {
  title?: string | null;
  settings?: Record<string, unknown> | null;
  options?: Array<{ label?: string | null }> | null;
};

export type VariantInstance = {
  seed: string;
  values: Record<string, number>;
  /** The answer formula's value as LaTeX, when the question defines one. */
  answer?: string;
  /** False when no draw satisfied every constraint; the last draw is still returned. */
  satisfiesConstraints: boolean;
};

const MAX_DRAWS = 200;
const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g;
const ANSWER_PLACEHOLDER = 'answer';
const SKIPPED_SETTINGS_KEYS = new Set(['parameters']);

function normaliseConstraint(constraint: string): string {
  return constraint
    .replace(/==/g, '=')
    .replace(/!=/g, '\\ne ')
    .replace(/<=/g, '\\le ')
    .replace(/>=/g, '\\ge ')
    .replace(/%/g, '\\bmod ');
}

function substituted(formula: string, values: Record<string, number>): Expression | null {
  const parsed = computeEngine.parse(formula);
  if (!isExpression(parsed) || parsed.json === 'Nothing' || parsed.isValid === false) return null;

  return parsed.subs(values);
}

function formatNumber(value: number): string {
  return String(Number(value.toPrecision(10)));
}

/** The value of a formula as text: an integer, an exact LaTeX fraction when every variable is a whole number, else a decimal. */
function evaluateFormula(formula: string, values: Record<string, number>): string | null {
  const expr = substituted(formula, values);
  if (!expr) return null;

  const numeric = evaluateComplex(expr);
  if (!numeric || Math.abs(numeric.im) > 1e-12 || !Number.isFinite(numeric.re)) return null;
  if (Number.isInteger(numeric.re)) return String(numeric.re);

  const hasOnlyWholeValues = Object.values(values).every(Number.isInteger);
  if (!hasOnlyWholeValues) return formatNumber(numeric.re);

  return expr.simplify().latex;
}

function constraintHolds(constraint: string, values: Record<string, number>): boolean {
  const expr = substituted(normaliseConstraint(constraint), values);

  return expr?.evaluate().json === 'True';
}

function answerSatisfies(parameters: QuestionParameters, values: Record<string, number>): boolean {
  if (!parameters.answerFormula) return true;

  const expr = substituted(parameters.answerFormula, values);
  const numeric = expr ? evaluateComplex(expr) : null;
  if (!numeric || !Number.isFinite(numeric.re)) return false;
  if (parameters.requireIntegerAnswer && !Number.isInteger(Number(numeric.re.toFixed(9)))) return false;

  return !parameters.requireNonzeroAnswer || Math.abs(numeric.re) > 1e-12;
}

/**
 * The numbers one seed produces. Draws repeat from the same seeded sequence until every constraint and the answer
 * rules hold, so the result depends only on the seed and the question's parameters.
 */
export function instantiateVariant(parameters: QuestionParameters, seed: string): VariantInstance {
  const random = createSeededRandom(seed);
  let values = drawVariableValues(parameters.variables, random);

  for (let attempt = 0; attempt < MAX_DRAWS; attempt++) {
    const ok =
      parameters.constraints.every((constraint) => constraintHolds(constraint, values)) &&
      answerSatisfies(parameters, values);
    if (ok) return { seed, values, answer: answerOf(parameters, values), satisfiesConstraints: true };

    values = drawVariableValues(parameters.variables, random);
  }

  return { seed, values, answer: answerOf(parameters, values), satisfiesConstraints: false };
}

function answerOf(parameters: QuestionParameters, values: Record<string, number>): string | undefined {
  if (!parameters.answerFormula) return undefined;

  return evaluateFormula(parameters.answerFormula, values) ?? undefined;
}

/** Replaces `{{a}}`, `{{answer}}` and `{{b / a}}` in text with the instance's numbers and formula values. */
export function fillPlaceholders(text: string, instance: VariantInstance, parameters: QuestionParameters): string {
  return text.replace(PLACEHOLDER, (match, inner: string) => {
    if (inner === ANSWER_PLACEHOLDER) return instance.answer ?? match;
    if (inner in instance.values) return formatNumber(instance.values[inner]);

    return evaluateFormula(inner, instance.values) ?? match;
  });
}

function fillDeep(value: unknown, fill: (text: string) => string, skipKeys: ReadonlySet<string>): unknown {
  if (typeof value === 'string') return fill(value);
  if (Array.isArray(value)) return value.map((entry) => fillDeep(entry, fill, skipKeys));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, skipKeys.has(key) ? entry : fillDeep(entry, fill, skipKeys)])
  );
}

/**
 * Returns the question as one seed shows it: placeholders in the title, option labels and every setting (accepted
 * answers, `correctValue`, description…) are filled in. A question without parameters is returned unchanged.
 */
export function instantiateQuestion<Question extends VariantQuestion>(question: Question, seed: string): Question {
  const parameters = readQuestionParameters(question.settings);
  if (!parameters) return question;

  const instance = instantiateVariant(parameters, seed);
  const fill = (text: string) => fillPlaceholders(text, instance, parameters);

  return {
    ...question,
    title: question.title == null ? question.title : fill(question.title),
    options: question.options?.map((option) => ({ ...option, label: option.label == null ? option.label : fill(option.label) })),
    settings: fillDeep(question.settings, fill, SKIPPED_SETTINGS_KEYS) as Record<string, unknown>
  };
}
