import { describe, expect, it } from 'vitest';
import {
  QUESTION_TYPE_KEY,
  fromApiPayload,
  isAutoGradableQuestionType,
  scoreAnswerForQuestion,
  toApiPayload,
  type ExerciseQuestionModel
} from '../src';

function buildThumbsQuestion(): ExerciseQuestionModel {
  return {
    id: 1,
    title: 'Was this lesson helpful?',
    questionType: QUESTION_TYPE_KEY.THUMBS,
    points: 5,
    settings: {},
    options: [
      { id: 1, label: 'Yes', value: 'true', isCorrect: false },
      { id: 2, label: 'No', value: 'false', isCorrect: false }
    ]
  };
}

describe('thumbs codec and scoring', () => {
  it('round-trips boolean answers through the API codec', () => {
    const question = buildThumbsQuestion();
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

  it('is not auto-graded and always scores zero', () => {
    const question = buildThumbsQuestion();

    expect(isAutoGradableQuestionType(QUESTION_TYPE_KEY.THUMBS)).toBe(false);
    expect(scoreAnswerForQuestion(question, { type: 'THUMBS', value: true })).toBe(0);
    expect(scoreAnswerForQuestion(question, { type: 'THUMBS', value: false })).toBe(0);
    expect(scoreAnswerForQuestion(question, { type: 'TRUE_FALSE', value: true })).toBe(0);
  });
});
