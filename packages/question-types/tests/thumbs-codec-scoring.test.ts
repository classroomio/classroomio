import { describe, expect, it } from 'vitest';
import {
  QUESTION_TYPE_KEY,
  fromApiPayload,
  scoreAnswerForQuestion,
  toApiPayload,
  type ExerciseQuestionModel
} from '../src';

function buildThumbsQuestion(correctValue: boolean): ExerciseQuestionModel {
  return {
    id: 1,
    title: 'Was this lesson helpful?',
    questionType: QUESTION_TYPE_KEY.THUMBS,
    points: 5,
    settings: { correctValue },
    options: [
      { id: 1, label: 'Yes', value: 'true', isCorrect: correctValue },
      { id: 2, label: 'No', value: 'false', isCorrect: !correctValue }
    ]
  };
}

describe('thumbs codec and scoring', () => {
  it('round-trips boolean answers through the API codec', () => {
    const question = buildThumbsQuestion(true);
    const payload = toApiPayload({ type: 'THUMBS', value: true }, 1);

    expect(payload).toEqual({ questionId: 1, answer: 'true' });
    expect(fromApiPayload(QUESTION_TYPE_KEY.THUMBS, payload, question)).toEqual({
      type: 'THUMBS',
      value: true
    });
    expect(fromApiPayload(QUESTION_TYPE_KEY.THUMBS, { questionId: 1, answer: 'yes' }, question)).toEqual({
      type: 'THUMBS',
      value: true
    });
    expect(fromApiPayload(QUESTION_TYPE_KEY.THUMBS, { questionId: 1, answer: 'no' }, question)).toEqual({
      type: 'THUMBS',
      value: false
    });
  });

  it('awards full points only when the selected thumb matches the key', () => {
    const question = buildThumbsQuestion(true);

    expect(scoreAnswerForQuestion(question, { type: 'THUMBS', value: true })).toBe(5);
    expect(scoreAnswerForQuestion(question, { type: 'THUMBS', value: false })).toBe(0);
    expect(scoreAnswerForQuestion(question, { type: 'TRUE_FALSE', value: true })).toBe(0);
  });
});
