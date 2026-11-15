import { describe, expect, it } from 'vitest';

import { scoreMathExpression } from '../src/math-grading';
import { readMathExpressionSettings } from '../src/math-settings';

function grade(student: string, accepted: string | string[], extra: Record<string, unknown> = {}, title?: string) {
  const acceptedAnswers = Array.isArray(accepted) ? accepted : [accepted];
  return scoreMathExpression(readMathExpressionSettings({ acceptedAnswers, ...extra }), student, { title });
}

describe('misconception detection', () => {
  it.each([
    ['-6', '6'],
    ['-(x+1)', 'x+1'],
    ['x=-3', 'x=3'],
    ['-\\frac{1}{2}', '\\frac{1}{2}']
  ])('names a sign error for %s vs %s', (student, accepted) => {
    expect(grade(student, accepted)).toMatchObject({ reason: 'wrong', misconception: 'sign_error' });
  });

  it.each([
    ['2', '\\frac{1}{2}'],
    ['\\frac{3}{2}', '\\frac{2}{3}'],
    ['x=\\frac{1}{4}', 'x=4']
  ])('names an inverted fraction for %s vs %s', (student, accepted) => {
    expect(grade(student, accepted)).toMatchObject({ reason: 'wrong', misconception: 'inverted_fraction' });
  });

  it('names a distribution slip from the question title', () => {
    expect(grade('2x+1', '2x+2', {}, 'Expand $2(x+1)$')).toMatchObject({
      reason: 'wrong',
      misconception: 'forgot_distribute'
    });
  });

  it('names a distribution slip from an unexpanded accepted answer', () => {
    expect(grade('3x+4', ['3(x+4)'])).toMatchObject({ misconception: 'forgot_distribute' });
  });

  it('names a negation that was not distributed', () => {
    expect(grade('-x+3', '-x-3', {}, 'Expand $-(x+3)$')).toMatchObject({ misconception: 'forgot_distribute' });
  });

  it.each([
    ['x<3', 'x>3'],
    ['x\\ge 2', 'x\\le 2']
  ])('names an inequality that was not flipped for %s vs %s', (student, accepted) => {
    expect(grade(student, accepted)).toMatchObject({ reason: 'wrong', misconception: 'forgot_flip_inequality' });
  });

  it.each([
    ['3x', '6x'],
    ['x', '4x'],
    ['1', 'x']
  ])('names a dropped factor for %s vs %s', (student, accepted) => {
    expect(grade(student, accepted)).toMatchObject({ reason: 'wrong', misconception: 'dropped_factor' });
  });

  it('does not call an extra factor a dropped one', () => {
    expect(grade('6x', '3x').misconception).toBeUndefined();
  });

  it('does not label unrelated wrong answers', () => {
    expect(grade('7', '6').misconception).toBeUndefined();
    expect(grade('x^2+5', 'x^2+2x').misconception).toBeUndefined();
  });

  it('does not label correct answers', () => {
    expect(grade('2x+2', '2x+2', {}, 'Expand $2(x+1)$')).toEqual({ reason: 'equivalent', matchedAnswer: '2x+2' });
  });

  it("lets the teacher's wrongAnswerFeedback win", () => {
    const result = grade('-6', '6', { wrongAnswerFeedback: [{ answer: '-6', feedback: 'Mind the sign.' }] });

    expect(result.feedback).toBe('Mind the sign.');
    expect(result.misconception).toBeUndefined();
  });
});
