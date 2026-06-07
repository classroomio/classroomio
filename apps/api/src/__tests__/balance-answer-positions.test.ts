import { describe, expect, it } from 'vitest';
import { balanceCorrectAnswerPositions } from '@cio/core/services/agent/balance-answer-positions';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';

type Option = { label: string; isCorrect: boolean };
type Question = { questionTypeId: number; question: string; options: Option[] };

function radio(question: string, labels: string[], correctIndex: number): Question {
  return {
    questionTypeId: QUESTION_TYPE.RADIO,
    question,
    options: labels.map((label, i) => ({ label, isCorrect: i === correctIndex }))
  };
}

function correctPosition(question: Question): number {
  return question.options.findIndex((option) => option.isCorrect);
}

describe('balanceCorrectAnswerPositions', () => {
  it('spreads the correct RADIO position across the batch instead of clustering', () => {
    // 12 questions, all authored with the answer at index 0 ("A is always right").
    const questions = Array.from({ length: 12 }, (_, i) => radio(`Q${i}`, ['alpha', 'bravo', 'charlie', 'delta'], 0));

    const balanced = balanceCorrectAnswerPositions(questions);
    const counts = [0, 0, 0, 0];
    balanced.forEach((question) => counts[correctPosition(question)]++);

    // 12 questions / 4 options → exactly 3 per position when perfectly balanced.
    expect(counts).toEqual([3, 3, 3, 3]);
  });

  it('keeps the same correct option, only its position changes', () => {
    const questions = [radio('Q', ['alpha', 'bravo', 'charlie', 'delta'], 0)];
    const [balanced] = balanceCorrectAnswerPositions(questions);

    const correct = balanced.options.find((option) => option.isCorrect);
    expect(correct?.label).toBe('alpha');
    expect(balanced.options).toHaveLength(4);
    expect(new Set(balanced.options.map((o) => o.label))).toEqual(new Set(['alpha', 'bravo', 'charlie', 'delta']));
    // Exactly one correct option survives.
    expect(balanced.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it('is deterministic for identical input', () => {
    const build = () => Array.from({ length: 8 }, (_, i) => radio(`Q${i}`, ['a', 'b', 'c', 'd'], 0));

    const first = balanceCorrectAnswerPositions(build()).map(correctPosition);
    const second = balanceCorrectAnswerPositions(build()).map(correctPosition);
    expect(first).toEqual(second);
  });

  it('does not shuffle options that reference other positions', () => {
    const questions = [radio('Q', ['Paris', 'London', 'Both of the above', 'All of the above'], 3)];
    const [balanced] = balanceCorrectAnswerPositions(questions);

    expect(balanced.options.map((o) => o.label)).toEqual(['Paris', 'London', 'Both of the above', 'All of the above']);
  });

  it('leaves naturally-ordered numeric ranges untouched', () => {
    const questions = [radio('Range?', ['0-10', '11-20', '21-30', '31-40'], 1)];
    const [balanced] = balanceCorrectAnswerPositions(questions);

    expect(balanced.options.map((o) => o.label)).toEqual(['0-10', '11-20', '21-30', '31-40']);
  });

  it('balances each option-count group independently', () => {
    const threeOption = Array.from({ length: 6 }, (_, i) => radio(`T${i}`, ['x', 'y', 'z'], 0));
    const fourOption = Array.from({ length: 8 }, (_, i) => radio(`F${i}`, ['a', 'b', 'c', 'd'], 0));

    const balanced = balanceCorrectAnswerPositions([...threeOption, ...fourOption]);

    const threeCounts = [0, 0, 0];
    balanced.slice(0, 6).forEach((q) => threeCounts[correctPosition(q)]++);
    expect(threeCounts).toEqual([2, 2, 2]);

    const fourCounts = [0, 0, 0, 0];
    balanced.slice(6).forEach((q) => fourCounts[correctPosition(q)]++);
    expect(fourCounts).toEqual([2, 2, 2, 2]);
  });

  it('shuffles CHECKBOX options without dropping correct answers', () => {
    // Correct answers authored at the top; expect them not all clustered after shuffle.
    const questions: Question[] = Array.from({ length: 10 }, (_, i) => ({
      questionTypeId: QUESTION_TYPE.CHECKBOX,
      question: `C${i}`,
      options: [
        { label: 'one', isCorrect: true },
        { label: 'two', isCorrect: true },
        { label: 'three', isCorrect: false },
        { label: 'four', isCorrect: false }
      ]
    }));

    const balanced = balanceCorrectAnswerPositions(questions);

    balanced.forEach((question) => {
      expect(question.options.filter((o) => o.isCorrect)).toHaveLength(2);
      expect(new Set(question.options.map((o) => o.label))).toEqual(new Set(['one', 'two', 'three', 'four']));
    });

    // Index 0 should not be correct in every single question once shuffled.
    const indexZeroAlwaysCorrect = balanced.every((q) => q.options[0].isCorrect);
    expect(indexZeroAlwaysCorrect).toBe(false);
  });

  it('leaves TRUE_FALSE and malformed questions untouched', () => {
    const trueFalse: Question = {
      questionTypeId: QUESTION_TYPE.TRUE_FALSE,
      question: 'TF',
      options: [
        { label: 'True', isCorrect: true },
        { label: 'False', isCorrect: false }
      ]
    };
    const noCorrect = radio('Q', ['a', 'b', 'c'], -1);

    const [balancedTf, balancedNone] = balanceCorrectAnswerPositions([trueFalse, noCorrect]);
    expect(balancedTf.options.map((o) => o.label)).toEqual(['True', 'False']);
    expect(balancedNone.options.map((o) => o.label)).toEqual(['a', 'b', 'c']);
  });
});
