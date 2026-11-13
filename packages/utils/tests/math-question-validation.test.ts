import { describe, expect, it } from 'vitest';

import { QUESTION_TYPE_IDS } from '@cio/question-types';

import { getQuestionOptionIssues } from '../src/validation/exercise';

describe('math question settings validation', () => {
  it('requires an accepted answer for MATH_EXPRESSION', () => {
    expect(getQuestionOptionIssues({ questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION, settings: {} })).toEqual([
      expect.any(String)
    ]);
    expect(
      getQuestionOptionIssues({ questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION, settings: { acceptedAnswers: [] } })
    ).toEqual(['Add at least one accepted answer']);
  });

  it('accepts complete MATH_EXPRESSION settings', () => {
    const settings = {
      acceptedAnswers: ['2x+2'],
      compare: { mode: 'exact_form', form: 'expanded' },
      units: { unit: 'm', allowConversion: true },
      variables: ['x'],
      wrongAnswerFeedback: [{ answer: '2x+1', feedback: 'Multiply the 1 by 2 as well.' }]
    };
    expect(getQuestionOptionIssues({ questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION, settings })).toEqual([]);
  });

  it('rejects an unknown required form and bad tolerances', () => {
    const issues = (compare: unknown) =>
      getQuestionOptionIssues({
        questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
        settings: { acceptedAnswers: ['1'], compare }
      });
    expect(issues({ mode: 'exact_form', form: 'pretty' })).toHaveLength(1);
    expect(issues({ mode: 'numeric', relativeTolerance: -0.1 })).toHaveLength(1);
    expect(issues({ mode: 'numeric', significantFigures: 0 })).toHaveLength(1);
    expect(issues({ mode: 'numeric', relativeTolerance: 0.01, significantFigures: 3 })).toEqual([]);
  });

  it('validates WORKED_SOLUTION settings', () => {
    const issues = (settings: Record<string, unknown>) =>
      getQuestionOptionIssues({ questionTypeId: QUESTION_TYPE_IDS.WORKED_SOLUTION, settings });
    expect(issues({ acceptedAnswers: ['4'], answerPoints: 2, workingInputs: ['typed', 'photo'] })).toEqual([]);
    expect(issues({ acceptedAnswers: ['4'], answerPoints: -1 })).toHaveLength(1);
    expect(issues({ acceptedAnswers: ['4'], workingInputs: ['video'] })).toHaveLength(1);
  });
});
