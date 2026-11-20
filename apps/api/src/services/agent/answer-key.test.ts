import { describe, expect, it } from 'vitest';
import { QUESTION_TYPE_IDS } from '@cio/question-types';

import { assertAnswerKeysVerified } from '@cio/core/services/exercise/answer-key';

describe('assertAnswerKeysVerified', () => {
  it('passes a key the engine confirms', () => {
    expect(() =>
      assertAnswerKeysVerified([
        {
          question: 'Compute $\\frac{1}{2}+\\frac{1}{3}$',
          questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
          settings: { acceptedAnswers: ['\\frac{5}{6}'] },
          verify: { expression: '\\frac{1}{2}+\\frac{1}{3}' }
        }
      ])
    ).not.toThrow();
  });

  it('throws a validation error naming the wrong key', () => {
    expect(() =>
      assertAnswerKeysVerified([
        {
          question: 'Compute $\\frac{1}{2}+\\frac{1}{3}$',
          questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
          settings: { acceptedAnswers: ['\\frac{2}{5}'] },
          verify: { expression: '\\frac{1}{2}+\\frac{1}{3}' }
        }
      ])
    ).toThrow(/Question 1.*does not equal/s);
  });

  it('ignores questions without a type', () => {
    expect(() => assertAnswerKeysVerified([{ question: 'x' }])).not.toThrow();
  });
});
