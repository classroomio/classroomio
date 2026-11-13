import { describe, expect, it } from 'vitest';
import { formatPoints, roundPoints, scoreSubmissionAnswers, type DbQuestionForScoring } from '../src';

const CHECKBOX_TYPE_ID = 2;

describe('points rounding', () => {
  it('rounds to two decimals', () => {
    expect(roundPoints(2 / 3)).toBe(0.67);
    expect(roundPoints(1.005)).toBe(1.01);
    expect(roundPoints(Number.NaN)).toBe(0);
  });

  it('formats without trailing zeros', () => {
    expect(formatPoints(0.5)).toBe('0.5');
    expect(formatPoints('1.50')).toBe('1.5');
    expect(formatPoints(2)).toBe('2');
    expect(formatPoints(null)).toBe('0');
  });
});

describe('scoreSubmissionAnswers', () => {
  it('keeps fractional partial credit instead of rounding it away', () => {
    const question: DbQuestionForScoring = {
      id: 7,
      questionTypeId: CHECKBOX_TYPE_ID,
      points: 1,
      options: [
        { id: 1, label: 'a', isCorrect: true },
        { id: 2, label: 'b', isCorrect: true },
        { id: 3, label: 'c', isCorrect: false },
        { id: 4, label: 'd', isCorrect: false }
      ]
    };
    const answers = new Map([[7, { type: 'CHECKBOX' as const, optionIds: [1] }]]);

    expect(scoreSubmissionAnswers([question], answers)).toEqual({
      scores: [{ questionId: 7, points: 0.5 }],
      total: 0.5
    });
  });
});
