import { describe, expect, it } from 'vitest';
import {
  decodeFillBlankAcceptedAnswers,
  fromApiPayload,
  getFillBlankAnswerKey,
  QUESTION_TYPE_KEY,
  scoreAnswerForQuestion,
  toApiPayload,
  type ExerciseQuestionModel
} from '../src';

function buildFillBlankQuestion(acceptedAnswers: unknown, points = 3): ExerciseQuestionModel {
  return {
    id: 1,
    title: 'Fill the blanks',
    questionType: QUESTION_TYPE_KEY.FILL_BLANK,
    points,
    settings: { acceptedAnswers }
  };
}

describe('fill-blank accepted answers codec', () => {
  it('reads the legacy comma string as one blank per value', () => {
    expect(decodeFillBlankAcceptedAnswers('analysis, content')).toEqual([['analysis'], ['content']]);
  });

  it('keeps commas inside array answers', () => {
    expect(decodeFillBlankAcceptedAnswers([['1,000', '1000'], ['(2, 3)'], ['{1, 2}']])).toEqual([
      ['1,000', '1000'],
      ['(2, 3)'],
      ['{1, 2}']
    ]);
  });

  it('reads a flat string array as one blank per value', () => {
    expect(decodeFillBlankAcceptedAnswers(['Paris', 'London'])).toEqual([['Paris'], ['London']]);
  });

  it('keeps empty entries for editing but drops them from the answer key', () => {
    const raw = [['', ' 4 '], [''], ['x']];

    expect(decodeFillBlankAcceptedAnswers(raw)).toEqual([['', ' 4 '], [''], ['x']]);
    expect(getFillBlankAnswerKey(raw)).toEqual([['4'], ['x']]);
  });

  it('returns no blanks for missing settings', () => {
    expect(getFillBlankAnswerKey(undefined)).toEqual([]);
    expect(getFillBlankAnswerKey(42)).toEqual([]);
  });
});

describe('fill-blank scoring', () => {
  const mathQuestion = buildFillBlankQuestion([['1,000', '1000'], ['(2, 3)'], ['{1, 2}']]);

  it('accepts answers that contain commas', () => {
    const answer = { type: 'FILL_BLANK' as const, values: ['1,000', '(2, 3)', '{1, 2}'] };

    expect(scoreAnswerForQuestion(mathQuestion, answer)).toBe(3);
  });

  it('accepts any alternative for a blank', () => {
    const answer = { type: 'FILL_BLANK' as const, values: ['1000', ' (2, 3) ', '{1, 2}'] };

    expect(scoreAnswerForQuestion(mathQuestion, answer)).toBe(3);
  });

  it('gives partial credit per correct blank, rounded to two decimals', () => {
    const answer = { type: 'FILL_BLANK' as const, values: ['1,000', '', '{1, 3}'] };

    expect(scoreAnswerForQuestion(buildFillBlankQuestion(mathQuestion.settings?.acceptedAnswers, 1), answer)).toBe(
      0.33
    );
  });

  it('still scores legacy comma strings', () => {
    const question = buildFillBlankQuestion('analysis,content', 2);

    expect(scoreAnswerForQuestion(question, { type: 'FILL_BLANK', values: ['Analysis', 'content'] })).toBe(2);
    expect(scoreAnswerForQuestion(question, { type: 'FILL_BLANK', values: ['analysis', 'wrong'] })).toBe(1);
  });
});

describe('fill-blank answer payload', () => {
  const question = buildFillBlankQuestion([['a'], ['b']]);

  it('keeps blank positions when an earlier blank is empty', () => {
    const payload = toApiPayload({ type: 'FILL_BLANK', values: ['', '(2, 3)'] }, 1);

    expect(fromApiPayload(QUESTION_TYPE_KEY.FILL_BLANK, payload, question)).toEqual({
      type: 'FILL_BLANK',
      values: ['', '(2, 3)']
    });
  });

  it('returns null when every blank is empty', () => {
    const payload = toApiPayload({ type: 'FILL_BLANK', values: [' ', ''] }, 1);

    expect(fromApiPayload(QUESTION_TYPE_KEY.FILL_BLANK, payload, question)).toBeNull();
  });
});
