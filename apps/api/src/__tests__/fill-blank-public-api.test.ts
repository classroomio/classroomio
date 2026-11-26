import { describe, expect, it } from 'vitest';

import { scoreSubmissionAnswers } from '@cio/question-types';
import {
  ZPublicApiAddExerciseQuestion,
  ZPublicApiUpdateExerciseQuestion
} from '@cio/utils/validation/public-api/course-exercise';

const QUESTION_TEXT = 'We are on a mission to end manual training and ____.';

function gradeFillBlank(acceptedAnswers: unknown, submitted: string[]) {
  const parsed = ZPublicApiAddExerciseQuestion.parse({
    question: QUESTION_TEXT,
    questionTypeId: 7,
    points: 1,
    settings: { acceptedAnswers }
  });
  const stored = { id: 1, questionTypeId: 7, points: parsed.points, settings: parsed.settings, options: [] };
  const answers = new Map([[1, { type: 'FILL_BLANK' as const, values: submitted }]]);

  return { parsed, total: scoreSubmissionAnswers([stored], answers).total };
}

describe('fill in the blank through the public API', () => {
  it('keeps settings.acceptedAnswers exactly as the editor stores it', () => {
    const { parsed } = gradeFillBlank('manual credentialing', []);

    expect(parsed.settings).toEqual({ acceptedAnswers: 'manual credentialing' });
  });

  it('marks an accepted answer correct, ignoring case and surrounding whitespace', () => {
    expect(gradeFillBlank('manual credentialing', ['manual credentialing']).total).toBe(1);
    expect(gradeFillBlank('manual credentialing', ['  Manual Credentialing ']).total).toBe(1);
  });

  it('marks any other answer wrong', () => {
    expect(gradeFillBlank('manual credentialing', ['credentialing']).total).toBe(0);
    expect(gradeFillBlank('manual credentialing', []).total).toBe(0);
  });

  it('treats comma-separated entries as one answer per blank, in order', () => {
    expect(gradeFillBlank('red, blue', ['red', 'blue']).total).toBe(1);
    expect(gradeFillBlank('red, blue', ['blue', 'red']).total).toBe(0);
  });

  it('rejects options instead of silently ignoring them', () => {
    const result = ZPublicApiAddExerciseQuestion.safeParse({
      question: QUESTION_TEXT,
      questionTypeId: 7,
      points: 1,
      options: [{ label: 'manual credentialing', isCorrect: true }]
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('settings.acceptedAnswers');
  });

  it.each([undefined, '', '  ,  ', ['a']])('rejects acceptedAnswers %j', (acceptedAnswers) => {
    const result = ZPublicApiAddExerciseQuestion.safeParse({
      question: QUESTION_TEXT,
      questionTypeId: 7,
      points: 1,
      settings: acceptedAnswers === undefined ? {} : { acceptedAnswers }
    });

    expect(result.success).toBe(false);
  });

  it('rejects a new fill in the blank question in an exercise update without answers', () => {
    const result = ZPublicApiUpdateExerciseQuestion.safeParse({
      question: QUESTION_TEXT,
      questionTypeId: 7,
      points: 1
    });

    expect(result.success).toBe(false);
  });
});

describe('other auto-graded types through the public API', () => {
  it('requires settings.correctValue for numeric', () => {
    const base = { question: 'How many?', questionTypeId: 6, points: 1 };

    expect(ZPublicApiAddExerciseQuestion.safeParse(base).success).toBe(false);
    expect(ZPublicApiAddExerciseQuestion.safeParse({ ...base, settings: { correctValue: 4 } }).success).toBe(true);
  });

  it('requires correctAnswers for each blank of a word bank', () => {
    const base = { question: 'Fill', questionTypeId: 11, points: 1, settings: { template: 'The ___ sat.' } };

    expect(ZPublicApiAddExerciseQuestion.safeParse(base).success).toBe(false);
    expect(
      ZPublicApiAddExerciseQuestion.safeParse({
        ...base,
        settings: { template: 'The ___ sat.', correctAnswers: ['cat'] }
      }).success
    ).toBe(true);
  });
});
