import { describe, expect, it } from 'vitest';

import { formatAnswerKeyIssues, verifyAnswerKey } from '../src/math-key-verification';
import { QUESTION_TYPE_KEY } from '../src/question-type-keys';
import { QUESTION_TYPE_IDS } from '../src/question-type-registry';

const MATH = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.MATH_EXPRESSION];
const WORKED = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.WORKED_SOLUTION];
const NUMERIC = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.NUMERIC];
const RADIO = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.RADIO];

describe('math expression keys', () => {
  it('accepts a key that agrees with the stated expression', () => {
    const issues = verifyAnswerKey({
      questionTypeId: MATH,
      settings: { acceptedAnswers: ['\\frac{5}{6}'] },
      verify: { expression: '\\frac{1}{2}+\\frac{1}{3}' }
    });

    expect(issues).toEqual([]);
  });

  it('rejects a key that disagrees with the stated expression', () => {
    const issues = verifyAnswerKey({
      questionTypeId: MATH,
      settings: { acceptedAnswers: ['\\frac{2}{5}'] },
      verify: { expression: '\\frac{1}{2}+\\frac{1}{3}' }
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('does not equal the accepted answer');
  });

  it('accepts an unsimplified worked expression even when the key must be in simplest form', () => {
    const issues = verifyAnswerKey({
      questionTypeId: MATH,
      settings: { acceptedAnswers: ['2x+2'], compare: { mode: 'exact_form', form: 'expanded' } },
      verify: { expression: '2(x+1)' }
    });

    expect(issues).toEqual([]);
  });

  it('rejects an answer that is not valid math', () => {
    const issues = verifyAnswerKey({ questionTypeId: MATH, settings: { acceptedAnswers: ['\\frac{1}{'] } });

    expect(issues[0]).toContain('not valid LaTeX');
  });

  it('requires an accepted answer', () => {
    expect(verifyAnswerKey({ questionTypeId: MATH, settings: {} })[0]).toContain('at least one accepted answer');
  });

  it('accepts a root that satisfies the stated equation and rejects one that does not', () => {
    const base = { questionTypeId: MATH, verify: { equation: '2x+3=11' } };

    expect(verifyAnswerKey({ ...base, settings: { acceptedAnswers: ['x=4'] } })).toEqual([]);
    expect(verifyAnswerKey({ ...base, settings: { acceptedAnswers: ['x=5'] } })[0]).toContain('does not satisfy');
  });

  it('checks every root of a quadratic', () => {
    const base = { questionTypeId: MATH, verify: { equation: 'x^2-5x+6=0' } };

    expect(verifyAnswerKey({ ...base, settings: { acceptedAnswers: ['x=2', 'x=3'] } })).toEqual([]);
    expect(verifyAnswerKey({ ...base, settings: { acceptedAnswers: ['x=2', 'x=4'] } })).toHaveLength(1);
  });

  it('rejects a wrongAnswerFeedback entry that is actually correct', () => {
    const issues = verifyAnswerKey({
      questionTypeId: MATH,
      settings: { acceptedAnswers: ['2x+2'], wrongAnswerFeedback: [{ answer: '2(x+1)', feedback: 'Expand it.' }] }
    });

    expect(issues[0]).toContain('equivalent to the accepted answer');
  });

  it('rejects verify on a question type that cannot use it', () => {
    const issues = verifyAnswerKey({ questionTypeId: RADIO, verify: { expression: '1+1' } });

    expect(issues[0]).toContain('verify only applies');
  });

  it('checks worked solution answer points', () => {
    const issues = verifyAnswerKey({
      questionTypeId: WORKED,
      points: 3,
      settings: { acceptedAnswers: ['4'], answerPoints: 5 }
    });

    expect(issues).toEqual(['settings.answerPoints cannot exceed the question points.']);
  });
});

describe('numeric keys', () => {
  it('accepts a number and a LaTeX fraction that match the expression', () => {
    expect(
      verifyAnswerKey({ questionTypeId: NUMERIC, settings: { correctValue: 4 }, verify: { expression: '2\\times 2' } })
    ).toEqual([]);
    expect(
      verifyAnswerKey({
        questionTypeId: NUMERIC,
        settings: { correctValue: '\\frac{3}{4}' },
        verify: { expression: '\\frac{1}{2}+\\frac{1}{4}' }
      })
    ).toEqual([]);
  });

  it('rejects a numeric key that disagrees with the expression', () => {
    const issues = verifyAnswerKey({
      questionTypeId: NUMERIC,
      settings: { correctValue: 5 },
      verify: { expression: '2\\times 2' }
    });

    expect(issues[0]).toContain('evaluates to 4');
  });

  it('honours the tolerance when comparing', () => {
    const settings = { correctValue: 3.14, tolerance: 0.01 };

    expect(verifyAnswerKey({ questionTypeId: NUMERIC, settings, verify: { expression: '\\pi' } })).toEqual([]);
    expect(
      verifyAnswerKey({
        questionTypeId: NUMERIC,
        settings: { correctValue: 3.2, tolerance: 0.01 },
        verify: { expression: '\\pi' }
      })
    ).toHaveLength(1);
  });

  it('checks the key against a one-variable equation', () => {
    const verify = { equation: '3x-1=8' };

    expect(verifyAnswerKey({ questionTypeId: NUMERIC, settings: { correctValue: 3 }, verify })).toEqual([]);
    expect(verifyAnswerKey({ questionTypeId: NUMERIC, settings: { correctValue: 4 }, verify })).toHaveLength(1);
  });

  it('requires a usable correct value', () => {
    expect(verifyAnswerKey({ questionTypeId: NUMERIC, settings: {} })).toHaveLength(1);
    expect(verifyAnswerKey({ questionTypeId: NUMERIC, settings: { correctValue: 'abc(' } })[0]).toContain(
      'not a valid number'
    );
  });
});

describe('question text', () => {
  it('flags an unclosed math delimiter in the title or an option', () => {
    expect(verifyAnswerKey({ questionTypeId: RADIO, title: 'Solve $x^2' })).toHaveLength(1);
    expect(verifyAnswerKey({ questionTypeId: RADIO, title: 'Solve $x^2$', optionLabels: ['$1', '$2$'] })).toHaveLength(
      1
    );
    expect(verifyAnswerKey({ questionTypeId: RADIO, title: 'Costs \\$5 and $$x$$', optionLabels: ['$1$'] })).toEqual(
      []
    );
  });
});

describe('formatAnswerKeyIssues', () => {
  it('returns null when every key is fine and lists each failing question otherwise', () => {
    const ok = { questionTypeId: NUMERIC, settings: { correctValue: 1 } };
    const bad = { questionTypeId: NUMERIC, settings: {} };

    expect(formatAnswerKeyIssues([ok])).toBeNull();
    expect(formatAnswerKeyIssues([ok, bad])).toContain('Question 2');
  });
});
