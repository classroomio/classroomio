import { describe, expect, it } from 'vitest';

import {
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_KEY,
  aggregateMultiPartScores,
  getMultiPartStemIds,
  scoreAutoGradedPart,
  scoreSubmissionAnswers,
  type AnswerData,
  type DbQuestionForScoring
} from '../src';
import { annotateMathAnswer, mathGrader } from '../src/math-grading';

const workedSettings = { acceptedAnswers: ['4'], answerPoints: 2 };

const worked: DbQuestionForScoring = {
  id: 1,
  questionTypeId: QUESTION_TYPE_IDS.WORKED_SOLUTION,
  points: 5,
  settings: workedSettings,
  options: []
};
const math: DbQuestionForScoring = {
  id: 2,
  questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
  points: 2,
  settings: { acceptedAnswers: ['2x+2'], wrongAnswerFeedback: [{ answer: '2x+1', feedback: 'Distribute the 2' }] },
  options: []
};
const paragraph: DbQuestionForScoring = {
  id: 3,
  questionTypeId: QUESTION_TYPE_IDS.TEXTAREA,
  points: 4,
  settings: {},
  options: []
};

const workedAnswer: AnswerData = {
  type: 'WORKED_SOLUTION',
  latex: '\\frac{8}{2}',
  working: { lines: ['8/2'], files: [] }
};

describe('scoreAutoGradedPart', () => {
  it('scores the answer part of a worked solution and leaves the working points pending', () => {
    const result = scoreAutoGradedPart([worked], new Map([[1, workedAnswer]]), mathGrader);

    expect(result).toEqual({ scores: [{ questionId: 1, points: 2 }], total: 2, pendingManualPoints: 3 });
  });

  it('leaves the whole working part pending when the final answer is wrong', () => {
    const wrong: AnswerData = { ...workedAnswer, latex: '5' } as AnswerData;
    const result = scoreAutoGradedPart([worked], new Map([[1, wrong]]), mathGrader);

    expect(result).toEqual({ scores: [{ questionId: 1, points: 0 }], total: 0, pendingManualPoints: 3 });
  });

  it('scores math expressions in full and counts manual questions as pending', () => {
    const answers = new Map<number, AnswerData>([
      [1, workedAnswer],
      [2, { type: 'MATH_EXPRESSION', latex: '2(x+1)' }],
      [3, { type: 'TEXTAREA', text: 'because' }]
    ]);
    const result = scoreAutoGradedPart([worked, math, paragraph], answers, mathGrader);

    expect(result.scores).toEqual([
      { questionId: 1, points: 2 },
      { questionId: 2, points: 2 },
      { questionId: 3, points: 0 }
    ]);
    expect(result.total).toBe(4);
    expect(result.pendingManualPoints).toBe(7);
  });

  it('counts the full points of an unanswered worked solution as pending', () => {
    const result = scoreAutoGradedPart([worked], new Map(), mathGrader);

    expect(result).toEqual({ scores: [{ questionId: 1, points: 0 }], total: 0, pendingManualPoints: 5 });
  });
});

describe('multi-part questions', () => {
  const stem: DbQuestionForScoring = {
    id: 10,
    questionTypeId: QUESTION_TYPE_IDS.SHORT_ANSWER,
    points: 0,
    settings: {},
    options: []
  };
  const partA: DbQuestionForScoring = { ...math, id: 11, parentQuestionId: 10 };
  const partB: DbQuestionForScoring = {
    id: 12,
    parentQuestionId: 10,
    questionTypeId: QUESTION_TYPE_IDS.NUMERIC,
    points: 1,
    settings: { correctValue: 0.75 },
    options: []
  };

  it('finds the stems', () => {
    expect([...getMultiPartStemIds([stem, partA, partB])]).toEqual([10]);
  });

  it('scores parts as normal questions and skips the stem', () => {
    const answers = new Map<number, AnswerData>([
      [11, { type: 'MATH_EXPRESSION', latex: '2x+2' }],
      [12, { type: 'NUMERIC', value: 0.75, latex: '3/4' }]
    ]);
    const { scores, total } = scoreSubmissionAnswers([stem, partA, partB], answers, mathGrader);

    expect(scores).toEqual([
      { questionId: 11, points: 2 },
      { questionId: 12, points: 1 }
    ]);
    expect(total).toBe(3);
  });

  it('rolls part scores up to the stem for display', () => {
    const rollup = aggregateMultiPartScores(
      [stem, partA, partB],
      [
        { questionId: 11, points: 2 },
        { questionId: 12, points: 0 }
      ]
    );

    expect(rollup).toEqual([{ questionId: 10, partIds: [11, 12], points: 2, maxPoints: 3 }]);
  });
});

describe('annotateMathAnswer', () => {
  const question = {
    id: 2,
    title: 'Expand',
    questionType: QUESTION_TYPE_KEY.MATH_EXPRESSION,
    points: 2,
    settings: math.settings
  };

  it('attaches the canonical MathJSON and the reason', () => {
    const annotated = annotateMathAnswer(question, { type: 'MATH_EXPRESSION', latex: '2(x+1)' });

    expect(annotated).toMatchObject({
      type: 'MATH_EXPRESSION',
      grading: { reason: 'equivalent', matchedAnswer: '2x+2' }
    });
    expect((annotated as { mathjson?: string }).mathjson).toBeTruthy();
  });

  it('attaches the teacher feedback of a known wrong answer', () => {
    const annotated = annotateMathAnswer(question, { type: 'MATH_EXPRESSION', latex: '2x+1' });

    expect(annotated).toMatchObject({ grading: { reason: 'wrong', feedback: 'Distribute the 2' } });
  });

  it('leaves other answers unchanged', () => {
    const answer: AnswerData = { type: 'TEXTAREA', text: 'hi' };

    expect(annotateMathAnswer(question, answer)).toBe(answer);
  });
});
