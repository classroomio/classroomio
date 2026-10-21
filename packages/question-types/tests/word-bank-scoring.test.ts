import { describe, expect, it } from 'vitest';
import { QUESTION_TYPE_KEY, scoreAnswerForQuestion, type ExerciseQuestionModel } from '../src';

function buildWordBankQuestion(correctAnswers: string[], template: string): ExerciseQuestionModel {
  return {
    id: 1,
    title: 'Fill the blanks',
    questionType: QUESTION_TYPE_KEY.WORD_BANK,
    points: 10,
    settings: { correctAnswers, template }
  };
}

describe('word-bank scoring with retained answers', () => {
  it('ignores retained answers beyond the template blank count', () => {
    const question = buildWordBankQuestion(['cat', 'dog', 'fish'], 'The ___ sat.');
    const answer = { type: 'WORD_BANK' as const, filledBlanks: ['cat'] };

    expect(scoreAnswerForQuestion(question, answer)).toBe(10);
  });

  it('still scores zero with no blanks in the template', () => {
    const question = buildWordBankQuestion(['cat'], 'No blanks here.');
    const answer = { type: 'WORD_BANK' as const, filledBlanks: [] };

    expect(scoreAnswerForQuestion(question, answer)).toBe(0);
  });
});
