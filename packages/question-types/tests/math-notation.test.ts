import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MATH_NOTATION,
  QUESTION_TYPE_KEY,
  formatMathDisplay,
  gradeMathQuestion,
  getDefaultMathKeyboard,
  normaliseNumberInput,
  readMathExpressionSettings,
  readMathNotationSettings,
  resolveMathNotation,
  type ExerciseQuestionModel,
  type MathNotationSettings
} from '../src';
import { annotateMathAnswer, createMathGrader, mathGrader } from '../src/math-grading';

const decimalComma: MathNotationSettings = { ...DEFAULT_MATH_NOTATION, decimalSeparator: 'comma' };
const decimalCommaDots: MathNotationSettings = { ...decimalComma, thousandsSeparator: 'dot' };
const decimalCommaSpaces: MathNotationSettings = { ...decimalComma, thousandsSeparator: 'space' };
const decimalPointCommas: MathNotationSettings = { ...DEFAULT_MATH_NOTATION, thousandsSeparator: 'comma' };
const decimalPointSpaces: MathNotationSettings = { ...DEFAULT_MATH_NOTATION, thousandsSeparator: 'space' };

function numericQuestion(settings: Record<string, unknown>): ExerciseQuestionModel {
  return { id: 1, title: 'Value', questionType: QUESTION_TYPE_KEY.NUMERIC, points: 2, settings };
}

function mathQuestion(settings: Record<string, unknown>): ExerciseQuestionModel {
  return { id: 2, title: 'Value', questionType: QUESTION_TYPE_KEY.MATH_EXPRESSION, points: 2, settings };
}

describe('readMathNotationSettings', () => {
  it('falls back to the defaults for missing and unknown values', () => {
    expect(readMathNotationSettings(undefined)).toEqual(DEFAULT_MATH_NOTATION);
    expect(readMathNotationSettings({ decimalSeparator: 'semicolon', gradeBand: 'phd' })).toEqual(
      DEFAULT_MATH_NOTATION
    );
  });

  it('drops a thousands separator equal to the decimal one', () => {
    expect(
      readMathNotationSettings({ decimalSeparator: 'comma', thousandsSeparator: 'comma' }).thousandsSeparator
    ).toBe('none');
    expect(readMathNotationSettings({ decimalSeparator: 'point', thousandsSeparator: 'dot' }).thousandsSeparator).toBe(
      'none'
    );
  });
});

describe('resolveMathNotation', () => {
  const org = { decimalSeparator: 'comma', thousandsSeparator: 'space', multiplicationSign: 'dot' };

  it('uses the organisation settings without an override', () => {
    expect(resolveMathNotation(org).decimalSeparator).toBe('comma');
    expect(resolveMathNotation(org, null).multiplicationSign).toBe('dot');
  });

  it('ignores an override that inherits from the organisation', () => {
    expect(resolveMathNotation(org, { inheritFromOrg: true, decimalSeparator: 'point' }).decimalSeparator).toBe(
      'comma'
    );
    expect(resolveMathNotation(org, { decimalSeparator: 'point' }).decimalSeparator).toBe('comma');
  });

  it('lets a course that opted out override individual fields', () => {
    const resolved = resolveMathNotation(org, { inheritFromOrg: false, decimalSeparator: 'point' });

    expect(resolved.decimalSeparator).toBe('point');
    expect(resolved.thousandsSeparator).toBe('space');
    expect(resolved.multiplicationSign).toBe('dot');
  });
});

describe('getDefaultMathKeyboard', () => {
  it.each([
    ['primary', 'numeric'],
    ['secondary', 'algebra'],
    ['advanced', 'calculus']
  ] as const)('maps %s to %s', (gradeBand, keyboard) => {
    expect(getDefaultMathKeyboard({ ...DEFAULT_MATH_NOTATION, gradeBand })).toBe(keyboard);
  });
});

describe('normaliseNumberInput', () => {
  it('leaves input untouched under the default notation', () => {
    expect(normaliseNumberInput('(1,2) + 1,000', DEFAULT_MATH_NOTATION)).toBe('(1,2) + 1,000');
  });

  it.each([
    [decimalComma, '0,5', '0.5'],
    [decimalComma, '0{,}5', '0.5'],
    [decimalComma, '12,75 + 3,5', '12.75 + 3.5'],
    [decimalComma, '\\frac{1,5}{2}', '\\frac{1.5}{2}'],
    [decimalComma, '0.5', '0.5'],
    [decimalComma, 'x+2', 'x+2'],
    [decimalCommaDots, '1.000,5', '1000.5'],
    [decimalCommaDots, '1.000.000', '1000000'],
    [decimalCommaDots, '1.000', '1000'],
    [decimalCommaDots, '12,5', '12.5'],
    [decimalCommaSpaces, '1 000,5', '1000.5'],
    [decimalCommaSpaces, '1\\,000,5', '1000.5'],
    [decimalCommaSpaces, '1\\ 000{,}5', '1000.5'],
    [decimalCommaSpaces, '1\u00a0000,5', '1000.5'],
    [decimalCommaSpaces, '12 345 678', '12345678'],
    [decimalPointCommas, '1,000.5', '1000.5'],
    [decimalPointCommas, '1,000,000', '1000000'],
    [decimalPointCommas, '2.5', '2.5'],
    [decimalPointCommas, '(1,2)', '(1,2)'],
    [decimalPointSpaces, '1 000.5', '1000.5'],
    [decimalPointSpaces, '3 1/2', '3 1/2']
  ])('reads %o: %s as %s', (notation, input, expected) => {
    expect(normaliseNumberInput(input, notation)).toBe(expected);
  });

  it.each([
    [decimalComma, '1,000.5'],
    [decimalCommaDots, '1,000.5'],
    [decimalCommaDots, '1.000.5,5'],
    [decimalCommaSpaces, '1.000,5'],
    [decimalPointCommas, '1.000,5'],
    [decimalPointSpaces, '1,000.5']
  ])('rejects mixed separators under %o: %s', (notation, input) => {
    expect(normaliseNumberInput(input, notation)).toBeNull();
  });
});

describe('formatMathDisplay', () => {
  it('shows the decimal comma', () => {
    expect(formatMathDisplay('0.5+2.25', decimalComma)).toBe('0{,}5+2{,}25');
  });

  it('groups integers of five or more digits', () => {
    expect(formatMathDisplay('1234567', decimalPointCommas)).toBe('1{,}234{,}567');
    expect(formatMathDisplay('12345.5', decimalCommaDots)).toBe('12.345{,}5');
    expect(formatMathDisplay('1234567', decimalPointSpaces)).toBe('1\\,234\\,567');
  });

  it('does not group four-digit numbers or exponents', () => {
    expect(formatMathDisplay('2026', decimalPointCommas)).toBe('2026');
    expect(formatMathDisplay('x^{12345}', decimalPointCommas)).toBe('x^{12{,}345}');
    expect(formatMathDisplay('x^2+y_1', decimalPointCommas)).toBe('x^2+y_1');
  });

  it('shows a dot for \\times when the multiplication sign is a dot', () => {
    const dot = { ...DEFAULT_MATH_NOTATION, multiplicationSign: 'dot' } as const;

    expect(formatMathDisplay('3\\times4', dot)).toBe('3\\cdot4');
    expect(formatMathDisplay('3\\times4', DEFAULT_MATH_NOTATION)).toBe('3\\times4');
    expect(formatMathDisplay('a\\timesb', dot)).toBe('a\\timesb');
  });

  it('leaves the default notation unchanged', () => {
    expect(formatMathDisplay('0.5+12345', DEFAULT_MATH_NOTATION)).toBe('0.5+12345');
  });
});

describe('createMathGrader', () => {
  it('is the plain grader under the default notation', () => {
    expect(createMathGrader(DEFAULT_MATH_NOTATION)).toBe(mathGrader);
  });

  describe('NUMERIC', () => {
    const settings = { correctValue: 0.5 };

    it.each([
      ['0,5', true],
      ['0{,}5', true],
      ['0.5', true],
      ['\\frac{1}{2}', true],
      ['0,6', false],
      ['5', false]
    ])('decimal comma grades %s as %s', (latex, expected) => {
      const grader = createMathGrader(decimalComma);

      expect(grader.gradeNumeric(settings, { type: 'NUMERIC', value: Number.NaN, latex })).toBe(expected);
    });

    it('accepts thousands separators', () => {
      const grader = createMathGrader(decimalCommaDots);

      expect(grader.gradeNumeric({ correctValue: 1000.5 }, { type: 'NUMERIC', value: 0, latex: '1.000,5' })).toBe(true);
      expect(grader.gradeNumeric({ correctValue: 1000.5 }, { type: 'NUMERIC', value: 0, latex: '1000,5' })).toBe(true);
      expect(grader.gradeNumeric({ correctValue: 1 }, { type: 'NUMERIC', value: 0, latex: '1.000' })).toBe(false);
    });

    it('accepts a space as the thousands separator', () => {
      const grader = createMathGrader(decimalCommaSpaces);

      expect(grader.gradeNumeric({ correctValue: 1000.5 }, { type: 'NUMERIC', value: 0, latex: '1 000,5' })).toBe(true);
    });

    it('rejects mixed separators', () => {
      const grader = createMathGrader(decimalComma);

      expect(grader.gradeNumeric({ correctValue: 1000.5 }, { type: 'NUMERIC', value: 0, latex: '1,000.5' })).toBe(
        false
      );
    });

    it('reads a LaTeX correct value written with a decimal comma', () => {
      const grader = createMathGrader(decimalComma);

      expect(grader.gradeNumeric({ correctValue: '2,5' }, { type: 'NUMERIC', value: 0, latex: '2,5' })).toBe(true);
    });

    it('keeps tolerances working', () => {
      const grader = createMathGrader(decimalComma);
      const answer = { type: 'NUMERIC', value: 0, latex: '3,14' } as const;

      expect(grader.gradeNumeric({ correctValue: 3.14159, tolerance: 0.01 }, answer)).toBe(true);
      expect(grader.gradeNumeric({ correctValue: 3.14159, tolerance: 0.0001 }, answer)).toBe(false);
    });
  });

  describe('MATH_EXPRESSION', () => {
    const grade = (notation: MathNotationSettings, accepted: string[], student: string, extra = {}) =>
      createMathGrader(notation).gradeExpression(
        readMathExpressionSettings({ acceptedAnswers: accepted, ...extra }),
        student
      ).reason;

    it.each([
      [['0.5'], '0,5', 'equivalent'],
      [['0,5'], '0,5', 'equivalent'],
      [['0,5'], '0.5', 'equivalent'],
      [['0.5'], '\\frac{1}{2}', 'equivalent'],
      [['0.5'], '0,6', 'wrong'],
      [['1.5x+2'], '1,5x+2', 'equivalent'],
      [['1.5x+2'], '2+1,5x', 'equivalent'],
      [['\\frac{1.5}{3}'], '0,5', 'equivalent']
    ])('decimal comma, accepted %o, student %s: %s', (accepted, student, reason) => {
      expect(grade(decimalComma, accepted, student)).toBe(reason);
    });

    it('reads thousands separators in expressions', () => {
      expect(grade(decimalCommaDots, ['1000.5'], '1.000,5')).toBe('equivalent');
      expect(grade(decimalCommaSpaces, ['1000.5'], '1 000,5')).toBe('equivalent');
      expect(grade(decimalPointCommas, ['1000.5'], '1,000.5')).toBe('equivalent');
      expect(grade(decimalCommaSpaces, ['2500x'], '2 500x')).toBe('equivalent');
    });

    it('marks mixed separators invalid', () => {
      expect(grade(decimalComma, ['1000.5'], '1,000.5')).toBe('invalid');
      expect(grade(decimalCommaDots, ['1000.5'], '1,000.5')).toBe('invalid');
    });

    it('works with the numeric compare mode', () => {
      expect(grade(decimalComma, ['3.14159'], '3,14', { compare: { mode: 'numeric', absoluteTolerance: 0.01 } })).toBe(
        'equivalent'
      );
      expect(grade(decimalComma, ['3.14159'], '3,2', { compare: { mode: 'numeric', absoluteTolerance: 0.01 } })).toBe(
        'wrong'
      );
    });

    it('localises wrong-answer feedback answers', () => {
      const result = createMathGrader(decimalComma).gradeExpression(
        readMathExpressionSettings({
          acceptedAnswers: ['0.5'],
          wrongAnswerFeedback: [{ answer: '0,25', feedback: 'You halved twice.' }]
        }),
        '0,25'
      );

      expect(result.feedback).toBe('You halved twice.');
    });

    it('still reads a plain integer expression under decimal comma', () => {
      expect(grade(decimalComma, ['2x+2'], '2(x+1)')).toBe('equivalent');
      expect(grade(decimalComma, ['2x+2'], '2x+3')).toBe('wrong');
    });
  });

  describe('through gradeMathQuestion and annotateMathAnswer', () => {
    const question = mathQuestion({ acceptedAnswers: ['0.5'] });

    it('awards points for a decimal-comma answer', () => {
      const grade = gradeMathQuestion(
        question,
        { type: 'MATH_EXPRESSION', latex: '0,5' },
        createMathGrader(decimalComma)
      );

      expect(grade?.points).toBe(2);
    });

    it('does not award them under the default notation', () => {
      const grade = gradeMathQuestion(question, { type: 'MATH_EXPRESSION', latex: '0,5' }, mathGrader);

      expect(grade?.points).toBe(0);
    });

    it('annotates with the localised canonical MathJSON', () => {
      const comma = annotateMathAnswer(question, { type: 'MATH_EXPRESSION', latex: '0,5' }, decimalComma);
      const point = annotateMathAnswer(question, { type: 'MATH_EXPRESSION', latex: '0.5' }, decimalComma);

      expect(comma).toMatchObject({ grading: { reason: 'equivalent' } });
      expect((comma as { mathjson?: string }).mathjson).toBe((point as { mathjson?: string }).mathjson);
    });

    it('grades a NUMERIC question', () => {
      const grade = createMathGrader(decimalComma).gradeNumeric(
        { correctValue: numericQuestion({ correctValue: 0.5 }).settings?.correctValue as number },
        { type: 'NUMERIC', value: 0.5, latex: '0,5' }
      );

      expect(grade).toBe(true);
    });
  });
});
