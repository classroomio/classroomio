export const MATH_DECIMAL_SEPARATORS = ['point', 'comma'] as const;
export type MathDecimalSeparator = (typeof MATH_DECIMAL_SEPARATORS)[number];

export const MATH_THOUSANDS_SEPARATORS = ['none', 'space', 'comma', 'dot'] as const;
export type MathThousandsSeparator = (typeof MATH_THOUSANDS_SEPARATORS)[number];

export const MATH_MULTIPLICATION_SIGNS = ['cross', 'dot'] as const;
export type MathMultiplicationSign = (typeof MATH_MULTIPLICATION_SIGNS)[number];

export const MATH_UNIT_SYSTEMS = ['metric', 'imperial'] as const;
export type MathUnitSystem = (typeof MATH_UNIT_SYSTEMS)[number];

export const MATH_GRADE_BANDS = ['primary', 'secondary', 'advanced'] as const;
export type MathGradeBand = (typeof MATH_GRADE_BANDS)[number];

export type MathKeyboardDefault = 'numeric' | 'algebra' | 'calculus';

/** How an organisation or course writes and reads numbers and operators. Stored as `organization.settings.math` and `course.metadata.math`. */
export type MathNotationSettings = {
  decimalSeparator: MathDecimalSeparator;
  thousandsSeparator: MathThousandsSeparator;
  multiplicationSign: MathMultiplicationSign;
  unitSystem: MathUnitSystem;
  gradeBand: MathGradeBand;
};

/** A course's override: it applies only when `inheritFromOrg` is `false`; otherwise the organisation's settings apply. */
export type MathNotationOverride = Partial<MathNotationSettings> & { inheritFromOrg?: boolean };

export const DEFAULT_MATH_NOTATION: MathNotationSettings = {
  decimalSeparator: 'point',
  thousandsSeparator: 'none',
  multiplicationSign: 'cross',
  unitSystem: 'metric',
  gradeBand: 'secondary'
};

export const MATH_KEYBOARD_BY_GRADE_BAND: Record<MathGradeBand, MathKeyboardDefault> = {
  primary: 'numeric',
  secondary: 'algebra',
  advanced: 'calculus'
};

const THOUSANDS_CHARACTER: Record<MathThousandsSeparator, string> = { none: '', space: ' ', comma: ',', dot: '.' };
const DECIMAL_CHARACTER: Record<MathDecimalSeparator, string> = { point: '.', comma: ',' };
const THOUSANDS_DISPLAY_LATEX: Record<MathThousandsSeparator, string> = {
  none: '',
  space: '\\,',
  comma: '{,}',
  dot: '.'
};

const NUMBER_TOKEN = /\d[\d.,\u0020]*\d|\d/g;
const DISPLAY_NUMBER = /(?<![\d.\\_^])(\d+)(?:\.(\d+))?(?![\d.])/g;
const DIGIT_GROUP_SPACING = /(?<=\d)\s*(?:\\[,;:! ]|~)\s*(?=\d)/g;
const GROUP_DISPLAY_MIN_DIGITS = 5;

function isOneOf<Value extends string>(values: readonly Value[], candidate: unknown): candidate is Value {
  return values.includes(candidate as Value);
}

/** Reads notation settings from stored JSON, dropping unknown values and a thousands separator that equals the decimal one. */
export function readMathNotationSettings(raw: unknown): MathNotationSettings {
  const stored = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const decimalSeparator = isOneOf(MATH_DECIMAL_SEPARATORS, stored.decimalSeparator)
    ? stored.decimalSeparator
    : DEFAULT_MATH_NOTATION.decimalSeparator;
  const thousandsSeparator = isOneOf(MATH_THOUSANDS_SEPARATORS, stored.thousandsSeparator)
    ? stored.thousandsSeparator
    : DEFAULT_MATH_NOTATION.thousandsSeparator;

  return {
    decimalSeparator,
    thousandsSeparator:
      THOUSANDS_CHARACTER[thousandsSeparator] === DECIMAL_CHARACTER[decimalSeparator] ? 'none' : thousandsSeparator,
    multiplicationSign: isOneOf(MATH_MULTIPLICATION_SIGNS, stored.multiplicationSign)
      ? stored.multiplicationSign
      : DEFAULT_MATH_NOTATION.multiplicationSign,
    unitSystem: isOneOf(MATH_UNIT_SYSTEMS, stored.unitSystem) ? stored.unitSystem : DEFAULT_MATH_NOTATION.unitSystem,
    gradeBand: isOneOf(MATH_GRADE_BANDS, stored.gradeBand) ? stored.gradeBand : DEFAULT_MATH_NOTATION.gradeBand
  };
}

/** The settings in force for a course: its own when it opted out of the organisation's, otherwise the organisation's. */
export function resolveMathNotation(orgRaw: unknown, courseOverrideRaw?: unknown): MathNotationSettings {
  const orgSettings = readMathNotationSettings(orgRaw);
  const override =
    courseOverrideRaw && typeof courseOverrideRaw === 'object' ? (courseOverrideRaw as MathNotationOverride) : null;
  if (!override || override.inheritFromOrg !== false) return orgSettings;

  return readMathNotationSettings({ ...orgSettings, ...override });
}

/** The virtual keyboard preset a grade band opens with when a question does not choose its own. */
export function getDefaultMathKeyboard(notation: MathNotationSettings): MathKeyboardDefault {
  return MATH_KEYBOARD_BY_GRADE_BAND[notation.gradeBand];
}

function isDefaultNumberNotation(notation: MathNotationSettings): boolean {
  return notation.decimalSeparator === 'point' && notation.thousandsSeparator === 'none';
}

function escapeForRegex(character: string): string {
  return character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normaliseNumberToken(token: string, notation: MathNotationSettings): string | null {
  const decimal = escapeForRegex(DECIMAL_CHARACTER[notation.decimalSeparator]);
  const thousandsCharacter = THOUSANDS_CHARACTER[notation.thousandsSeparator];
  const integerPart = thousandsCharacter
    ? '(?:\\d+|\\d{1,3}(?:' + escapeForRegex(thousandsCharacter) + '\\d{3})+)'
    : '\\d+';
  const valid = new RegExp('^(' + integerPart + ')(?:' + decimal + '(\\d+))?$').exec(token);

  if (valid) {
    const [, integer, fraction] = valid;
    const digits = thousandsCharacter ? integer.split(thousandsCharacter).join('') : integer;

    return fraction === undefined ? digits : digits + '.' + fraction;
  }

  return token.includes('.') && token.includes(',') ? null : token;
}

/**
 * Rewrites the numbers in a typed answer or accepted answer to plain point notation: the decimal separator becomes a
 * point and thousands separators are removed. Returns null when a number mixes separators in a way the notation does
 * not allow (`1,000.5` under decimal comma). Answers are returned unchanged under the default notation.
 */
export function normaliseNumberInput(input: string, notation: MathNotationSettings): string | null {
  if (isDefaultNumberNotation(notation)) return input;

  const cleaned = input
    .replace(/\\?\{,\\?\}/g, ',')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(DIGIT_GROUP_SPACING, ' ');
  let isValid = true;
  const normalised = cleaned.replace(NUMBER_TOKEN, (token) => {
    const next = normaliseNumberToken(token, notation);
    if (next === null) isValid = false;

    return next ?? token;
  });

  return isValid ? normalised : null;
}

function groupIntegerDigits(digits: string, thousandsSeparator: MathThousandsSeparator): string {
  if (thousandsSeparator === 'none' || digits.length < GROUP_DISPLAY_MIN_DIGITS) return digits;

  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }

  return groups.join(THOUSANDS_DISPLAY_LATEX[thousandsSeparator]);
}

/**
 * Applies the display preferences to LaTeX the author wrote in point notation: the decimal separator, thousands
 * grouping of integers with five or more digits, and `\\times` shown as `\\cdot` when the multiplication sign is a dot.
 */
export function formatMathDisplay(latex: string, notation: MathNotationSettings): string {
  const withNumbers = latex.replace(DISPLAY_NUMBER, (_match, integer: string, fraction?: string) => {
    const grouped = groupIntegerDigits(integer, notation.thousandsSeparator);
    if (fraction === undefined) return grouped;

    return grouped + (notation.decimalSeparator === 'comma' ? '{,}' : '.') + fraction;
  });

  return notation.multiplicationSign === 'dot' ? withNumbers.replace(/\\times(?![a-zA-Z])/g, '\\cdot') : withNumbers;
}
