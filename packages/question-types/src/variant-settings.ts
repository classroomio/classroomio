export const VARIABLE_TYPES = ['int', 'decimal', 'choice'] as const;
export type VariableType = (typeof VARIABLE_TYPES)[number];

export type QuestionVariable = {
  /** One letter, so formulas such as `2ab` parse unambiguously; `e` and `i` are reserved for the constants. */
  name: string;
  type: VariableType;
  min: number;
  max: number;
  step: number;
  /** Values a `choice` variable picks from. */
  choices: number[];
};

export type QuestionParameters = {
  variables: QuestionVariable[];
  /** Conditions over the variables that every instance must satisfy, such as `a != 0` or `b > a`. */
  constraints: string[];
  /** Expression over the variables for the answer; `{{answer}}` stands for its value in any text. */
  answerFormula: string;
  requireIntegerAnswer: boolean;
  requireNonzeroAnswer: boolean;
};

export const VARIABLE_NAME_PATTERN = /^[a-df-hj-zA-DF-HJ-Z]$/;
export const MAX_SEED_LENGTH = 64;
export const MAX_VARIABLES = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toFinite(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function readVariable(raw: unknown): QuestionVariable | null {
  if (!isRecord(raw)) return null;

  const name = String(raw.name ?? '').trim();
  if (!VARIABLE_NAME_PATTERN.test(name)) return null;

  const type = VARIABLE_TYPES.includes(raw.type as VariableType) ? (raw.type as VariableType) : 'int';
  const min = toFinite(raw.min, 1);
  const max = toFinite(raw.max, Math.max(min, 9));
  const defaultStep = type === 'decimal' ? 0.1 : 1;
  const requestedStep = toFinite(raw.step, defaultStep);
  const choices = Array.isArray(raw.choices)
    ? raw.choices.map((choice) => Number(choice)).filter((choice) => Number.isFinite(choice))
    : [];

  return {
    name,
    type,
    min: Math.min(min, max),
    max: Math.max(min, max),
    step: requestedStep > 0 ? requestedStep : defaultStep,
    choices
  };
}

/** Reads `settings.parameters`; null when the question is not parameterised. */
export function readQuestionParameters(settings: Record<string, unknown> | null | undefined): QuestionParameters | null {
  const raw = settings?.parameters;
  if (!isRecord(raw) || !Array.isArray(raw.variables)) return null;

  const seen = new Set<string>();
  const variables = raw.variables
    .map(readVariable)
    .filter((variable): variable is QuestionVariable => variable !== null)
    .filter((variable) => !seen.has(variable.name) && seen.add(variable.name))
    .slice(0, MAX_VARIABLES);
  if (variables.length === 0) return null;

  const constraints = Array.isArray(raw.constraints)
    ? raw.constraints.map((constraint) => String(constraint ?? '').trim()).filter(Boolean)
    : [];

  return {
    variables,
    constraints,
    answerFormula: String(raw.answerFormula ?? '').trim(),
    requireIntegerAnswer: raw.requireIntegerAnswer === true,
    requireNonzeroAnswer: raw.requireNonzeroAnswer === true
  };
}

export function isSeedValid(seed: unknown): seed is string {
  return typeof seed === 'string' && seed.length > 0 && seed.length <= MAX_SEED_LENGTH;
}

function hashSeed(seed: string): number {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index++) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);

  return (hash ^ (hash >>> 16)) >>> 0;
}

/** Deterministic generator of numbers in [0, 1): the same seed gives the same sequence on the client, the API and review. */
export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh random seed for one attempt at one question. */
export function createVariantSeed(): string {
  const bytes = new Uint32Array(2);
  globalThis.crypto.getRandomValues(bytes);

  return bytes[0].toString(36) + bytes[1].toString(36);
}

function decimalsOf(step: number): number {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);

  return text.includes('.') ? text.split('.')[1].length : 0;
}

/** Draws one value per variable, in order, from `random`. */
export function drawVariableValues(
  variables: readonly QuestionVariable[],
  random: () => number
): Record<string, number> {
  const values: Record<string, number> = {};

  for (const variable of variables) {
    if (variable.type === 'choice' && variable.choices.length > 0) {
      values[variable.name] = variable.choices[Math.floor(random() * variable.choices.length)];
      continue;
    }

    const steps = Math.floor((variable.max - variable.min) / variable.step + 1e-9) + 1;
    const picked = variable.min + Math.floor(random() * steps) * variable.step;
    values[variable.name] = Number(picked.toFixed(decimalsOf(variable.step)));
  }

  return values;
}
