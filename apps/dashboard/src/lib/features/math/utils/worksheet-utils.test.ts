import { describe, expect, it } from 'vitest';

import type { WorksheetQuestion } from './types';
import {
  getDraftAnswer,
  getIncludedQuestions,
  toWorksheetDrafts,
  withCorrectOption,
  withDraftAnswer
} from './worksheet-utils';

const verified: WorksheetQuestion = {
  title: 'Work out $\\frac{1}{2}+\\frac{1}{3}$',
  type: 'MATH_EXPRESSION',
  points: 1,
  settings: { acceptedAnswers: ['\\frac{5}{6}'] },
  options: [],
  verified: true,
  issues: []
};

const unverified: WorksheetQuestion = {
  title: 'What is $3^2+4^2$?',
  type: 'RADIO',
  points: 1,
  settings: {},
  options: [
    { label: '12', isCorrect: false },
    { label: '25', isCorrect: true }
  ],
  verified: false,
  issues: ['The engine could not check this answer against the question.']
};

describe('worksheet drafts', () => {
  it('includes verified questions and leaves unverified ones out until ticked', () => {
    const drafts = toWorksheetDrafts([verified, unverified]);

    expect(drafts.map((draft) => draft.included)).toEqual([true, false]);
    expect(getIncludedQuestions(drafts)).toHaveLength(1);
  });

  it('reads and replaces the answer of math and numeric drafts', () => {
    const [mathDraft] = toWorksheetDrafts([verified]);
    const numericDraft = { ...mathDraft, type: 'NUMERIC' as const, settings: { correctValue: '4' } };

    expect(getDraftAnswer(mathDraft)).toBe('\\frac{5}{6}');
    expect(getDraftAnswer(numericDraft)).toBe('4');
    expect(withDraftAnswer(mathDraft, 'x=2').settings).toEqual({ acceptedAnswers: ['x=2'] });
    expect(withDraftAnswer(numericDraft, '5').settings).toEqual({ correctValue: '5' });
    expect(withDraftAnswer(mathDraft, 'x=2').isEdited).toBe(true);
  });

  it('moves the correct option', () => {
    const [, radioDraft] = toWorksheetDrafts([verified, unverified]);

    expect(withCorrectOption(radioDraft, 0).options.map((option) => option.isCorrect)).toEqual([true, false]);
  });
});
