import { describe, expect, it } from 'vitest';
import type { AnswerData } from '@cio/question-types';

import { buildCurrentAttempt, type CurrentAttemptFocus } from './current-attempt';

const focus: CurrentAttemptFocus = { exerciseId: 'exercise-1', questionId: 7, questionKey: 'q-7' };

describe('buildCurrentAttempt', () => {
  it('sends the unsubmitted math answer of the focused question', () => {
    const answers: Record<string, AnswerData> = { 'q-7': { type: 'MATH_EXPRESSION', latex: '2x+1' } };

    expect(buildCurrentAttempt(focus, answers, 'exercise-1')).toEqual({
      questionId: 7,
      answer: { type: 'MATH_EXPRESSION', latex: '2x+1' }
    });
  });

  it('sends the working lines of a worked solution', () => {
    const answers: Record<string, AnswerData> = {
      'q-7': { type: 'WORKED_SOLUTION', latex: 'x=4', working: { lines: ['2x+3=11', '2x=8'], files: [] } }
    };

    expect(buildCurrentAttempt(focus, answers, 'exercise-1')?.answer).toEqual({
      type: 'WORKED_SOLUTION',
      latex: 'x=4',
      working: { lines: ['2x+3=11', '2x=8'] }
    });
  });

  it('drops a numeric value that is not finite', () => {
    const answers: Record<string, AnswerData> = {
      'q-7': { type: 'NUMERIC', value: Number.NaN, latex: '\\frac{3}{4}' }
    };

    expect(buildCurrentAttempt(focus, answers, 'exercise-1')?.answer).toEqual({
      type: 'NUMERIC',
      latex: '\\frac{3}{4}',
      value: undefined
    });
  });

  it('sends only the question when nothing is typed yet', () => {
    expect(buildCurrentAttempt(focus, {}, 'exercise-1')).toEqual({ questionId: 7 });
  });

  it('sends nothing for another exercise or without a focus', () => {
    expect(buildCurrentAttempt(focus, {}, 'exercise-2')).toBeUndefined();
    expect(buildCurrentAttempt(null, {}, 'exercise-1')).toBeUndefined();
    expect(buildCurrentAttempt(focus, {}, undefined)).toBeUndefined();
  });

  it('caps the length of working lines', () => {
    const lines = Array.from({ length: 40 }, () => 'x'.repeat(600));
    const answers: Record<string, AnswerData> = {
      'q-7': { type: 'WORKED_SOLUTION', latex: '', working: { lines, files: [] } }
    };
    const sent = buildCurrentAttempt(focus, answers, 'exercise-1')?.answer;

    expect(sent && 'working' in sent ? sent.working.lines : []).toHaveLength(30);
    expect(sent && 'working' in sent ? sent.working.lines[0] : '').toHaveLength(500);
  });
});
