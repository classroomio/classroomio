import { describe, expect, it } from 'vitest';

import {
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_KEY,
  fromApiPayload,
  getWorkedSolutionPointSplit,
  gradeMathQuestion,
  readMathExpressionSettings,
  readWorkedSolutionSettings,
  scoreAnswerForQuestion,
  scoreSubmissionAnswers,
  toApiPayload,
  type AnswerData,
  type ExerciseQuestionModel
} from '../src';
import { mathGrader, parseMathNumber, scoreNumericAnswer } from '../src/math-grading';

function numericQuestion(settings: Record<string, unknown>): ExerciseQuestionModel {
  return { id: 1, title: 'Value', questionType: QUESTION_TYPE_KEY.NUMERIC, points: 2, settings };
}

function mathQuestion(settings: Record<string, unknown>, points = 2): ExerciseQuestionModel {
  return { id: 2, title: 'Expand', questionType: QUESTION_TYPE_KEY.MATH_EXPRESSION, points, settings };
}

function workedQuestion(settings: Record<string, unknown>, points = 5): ExerciseQuestionModel {
  return { id: 3, title: 'Solve', questionType: QUESTION_TYPE_KEY.WORKED_SOLUTION, points, settings };
}

describe('parseMathNumber', () => {
  it.each([
    ['3/4', 0.75],
    ['\\frac{3}{4}', 0.75],
    ['1 1/2', 1.5],
    ['-1 1/2', -1.5],
    ['1\\frac{1}{2}', 1.5],
    ['\\pi', Math.PI],
    ['2\\pi', 2 * Math.PI],
    ['\\sqrt{2}', Math.SQRT2],
    ['3.2e4', 32000],
    ['3.2E4', 32000],
    ['3.2\\times10^{4}', 32000],
    ['1.2\\times 10^{-3}', 0.0012],
    ['1,000', 1000],
    ['1,234,567.5', 1234567.5],
    ['-7', -7],
    ['0.5', 0.5],
    ['.5', 0.5],
    ['12\\%', 0.12],
    ['$\\frac{1}{3}$', 1 / 3]
  ])('reads %s', (latex, expected) => {
    expect(parseMathNumber(latex)).toBeCloseTo(expected, 12);
  });

  it.each(['', 'x', 'x+1', '\\sqrt{-1}', 'abc', '1,0', '(1,2)'])('rejects %j', (latex) => {
    expect(parseMathNumber(latex)).toBeNaN();
  });
});

describe('NUMERIC scoring', () => {
  it('grades legacy { value } answers exactly as before, with or without the math grader', () => {
    const question = numericQuestion({ correctValue: 3.14, tolerance: 0.005 });
    for (const grader of [undefined, mathGrader]) {
      expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 3.14 }, grader)).toBe(2);
      expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 3.144 }, grader)).toBe(2);
      expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 3.146 }, grader)).toBe(0);
    }
  });

  it('keeps reading a numeric string correctValue and tolerance', () => {
    const question = numericQuestion({ correctValue: '42', tolerance: '0' });
    expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 42 })).toBe(2);
    expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 42.1 })).toBe(0);
  });

  it('scores 0 when correctValue is missing', () => {
    expect(scoreAnswerForQuestion(numericQuestion({}), { type: 'NUMERIC', value: 0 }, mathGrader)).toBe(0);
  });

  it.each([
    ['3/4', 0.75],
    ['\\frac{6}{8}', 0.75],
    ['1 1/2', 1.5],
    ['\\frac{3}{2}', 1.5],
    ['\\pi', Math.PI],
    ['\\sqrt{2}', Math.SQRT2],
    ['3.2\\times10^{4}', 32000],
    ['3.2e4', 32000]
  ])('reads the typed answer %s', (latex, correctValue) => {
    const question = numericQuestion({ correctValue });
    expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: Number.NaN, latex }, mathGrader)).toBe(2);
  });

  it('reads a LaTeX correctValue', () => {
    const question = numericQuestion({ correctValue: '\\frac{3}{4}' });
    expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 0.75 }, mathGrader)).toBe(2);
    expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 0.7, latex: '7/10' }, mathGrader)).toBe(0);
  });

  it('applies relative tolerance', () => {
    const settings = { correctValue: 200, relativeTolerance: 0.05 };
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 209 })).toBe(true);
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 191 })).toBe(true);
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 211 })).toBe(false);
  });

  it('accepts either tolerance when both are set', () => {
    const settings = { correctValue: 0.001, tolerance: 0.01, relativeTolerance: 0.01 };
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 0.009 })).toBe(true);
  });

  it('applies significant figures', () => {
    const settings = { correctValue: '\\pi', significantFigures: 3 };
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 3.14, latex: '3.14' })).toBe(true);
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 3.142, latex: '3.142' })).toBe(false);
    expect(scoreNumericAnswer(settings, { type: 'NUMERIC', value: 3.1, latex: '3.1' })).toBe(false);
    expect(
      scoreNumericAnswer({ correctValue: 0.012345, significantFigures: 2 }, { type: 'NUMERIC', value: 0.012 })
    ).toBe(true);
  });

  it('scores 0 for unparseable typed answers', () => {
    const question = numericQuestion({ correctValue: 1 });
    expect(scoreAnswerForQuestion(question, { type: 'NUMERIC', value: 1, latex: 'x+' }, mathGrader)).toBe(0);
  });
});

describe('MATH_EXPRESSION scoring', () => {
  const question = mathQuestion({
    acceptedAnswers: ['2x+2'],
    compare: { mode: 'exact_form', form: 'expanded' },
    wrongAnswerFeedback: [{ answer: '2x+1', feedback: 'Multiply the 1 by 2 as well.' }]
  });

  it('awards full points for an equivalent answer in the required form', () => {
    expect(scoreAnswerForQuestion(question, { type: 'MATH_EXPRESSION', latex: '2+2x' }, mathGrader)).toBe(2);
  });

  it('awards 0 for a right value in the wrong form', () => {
    expect(scoreAnswerForQuestion(question, { type: 'MATH_EXPRESSION', latex: '2(x+1)' }, mathGrader)).toBe(0);
  });

  it('awards 0 without the math grader', () => {
    expect(scoreAnswerForQuestion(question, { type: 'MATH_EXPRESSION', latex: '2x+2' })).toBe(0);
  });

  it('awards 0 for an answer of another type', () => {
    expect(scoreAnswerForQuestion(question, { type: 'SHORT_ANSWER', text: '2x+2' }, mathGrader)).toBe(0);
  });

  it('returns the reason and feedback for review', () => {
    expect(gradeMathQuestion(question, { type: 'MATH_EXPRESSION', latex: '2x+1' }, mathGrader)).toEqual({
      points: 0,
      pendingManualPoints: 0,
      result: { reason: 'wrong', feedback: 'Multiply the 1 by 2 as well.' }
    });
    expect(gradeMathQuestion(question, { type: 'MATH_EXPRESSION', latex: '' }, mathGrader)?.result.reason).toBe(
      'invalid'
    );
  });

  it('returns null for non-math questions', () => {
    expect(gradeMathQuestion(numericQuestion({}), { type: 'NUMERIC', value: 1 }, mathGrader)).toBeNull();
  });

  it('keeps fractional question points', () => {
    const half = mathQuestion({ acceptedAnswers: ['x'] }, 0.5);
    expect(scoreAnswerForQuestion(half, { type: 'MATH_EXPRESSION', latex: 'x' }, mathGrader)).toBe(0.5);
  });
});

describe('WORKED_SOLUTION scoring', () => {
  const settings = { acceptedAnswers: ['4'], answerPoints: 2 };
  const answer: AnswerData = {
    type: 'WORKED_SOLUTION',
    latex: 'x=4',
    working: { lines: ['2x+3=11', '2x=8', 'x=4'], files: [] }
  };

  it('splits points between the answer and the working', () => {
    expect(getWorkedSolutionPointSplit(settings, 5)).toEqual({ answerPoints: 2, workingPoints: 3 });
    expect(getWorkedSolutionPointSplit({}, 5)).toEqual({ answerPoints: 2.5, workingPoints: 2.5 });
    expect(getWorkedSolutionPointSplit({ answerPoints: 9 }, 5)).toEqual({ answerPoints: 5, workingPoints: 0 });
    expect(getWorkedSolutionPointSplit({ answerPoints: -1 }, 4)).toEqual({ answerPoints: 2, workingPoints: 2 });
  });

  it('auto-grades only the answer part and leaves the working for manual grading', () => {
    const grade = gradeMathQuestion(workedQuestion(settings), answer, mathGrader);
    expect(grade).toEqual({ points: 2, pendingManualPoints: 3, result: { reason: 'equivalent', matchedAnswer: '4' } });
    expect(scoreAnswerForQuestion(workedQuestion(settings), answer, mathGrader)).toBe(2);
  });

  it('awards no answer points for a wrong final answer but still leaves the working pending', () => {
    const grade = gradeMathQuestion(workedQuestion(settings), { ...answer, latex: '7' }, mathGrader);
    expect(grade).toMatchObject({ points: 0, pendingManualPoints: 3, result: { reason: 'wrong' } });
  });

  it('is not auto-gradable, so a submission with it waits for manual grading', () => {
    const { scores } = scoreSubmissionAnswers(
      [{ id: 3, questionTypeId: QUESTION_TYPE_IDS.WORKED_SOLUTION, points: 5, settings, options: [] }],
      new Map([[3, answer]]),
      mathGrader
    );
    expect(scores).toEqual([{ questionId: 3, points: 0 }]);
  });

  it('reads worked solution settings with defaults', () => {
    expect(readWorkedSolutionSettings({ acceptedAnswers: ['4'], workingInputs: ['photo', 'bogus'] }, 4)).toEqual({
      ...readMathExpressionSettings({ acceptedAnswers: ['4'] }),
      answerPoints: 2,
      workingInputs: ['photo']
    });
  });
});

describe('scoreSubmissionAnswers with math questions', () => {
  it('grades math questions only when the grader is passed', () => {
    const questions = [
      {
        id: 10,
        questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
        points: 2,
        settings: { acceptedAnswers: ['2x+2'] },
        options: []
      },
      { id: 11, questionTypeId: QUESTION_TYPE_IDS.NUMERIC, points: 1, settings: { correctValue: 0.75 }, options: [] }
    ];
    const answers = new Map<number, AnswerData>([
      [10, { type: 'MATH_EXPRESSION', latex: '2(x+1)' }],
      [11, { type: 'NUMERIC', value: 0.75, latex: '3/4' }]
    ]);

    expect(scoreSubmissionAnswers(questions, answers, mathGrader).total).toBe(3);
    expect(scoreSubmissionAnswers(questions, answers).total).toBe(1);
  });
});

describe('settings readers', () => {
  it('drops malformed MATH_EXPRESSION settings', () => {
    expect(
      readMathExpressionSettings({
        acceptedAnswers: ['2x', '', null, ' x '],
        compare: { mode: 'exact_form', form: 'bogus' },
        units: { unit: '' },
        variables: 'x',
        wrongAnswerFeedback: [{ answer: 'x', feedback: '' }, { answer: '2', feedback: 'Close' }, 'nope']
      })
    ).toEqual({
      acceptedAnswers: ['2x', 'x'],
      compare: { mode: 'equivalent' },
      units: undefined,
      variables: [],
      wrongAnswerFeedback: [{ answer: '2', feedback: 'Close' }]
    });
  });

  it('reads numeric compare tolerances', () => {
    expect(
      readMathExpressionSettings({
        compare: { mode: 'numeric', relativeTolerance: '0.01', absoluteTolerance: -1, significantFigures: 2.5 }
      }).compare
    ).toEqual({
      mode: 'numeric',
      relativeTolerance: 0.01,
      absoluteTolerance: undefined,
      significantFigures: undefined
    });
  });

  it('reads units', () => {
    expect(readMathExpressionSettings({ units: { unit: ' m ', allowConversion: true } }).units).toEqual({
      unit: 'm',
      allowConversion: true
    });
  });
});

describe('math answer codecs', () => {
  const question = mathQuestion({});

  it('round-trips MATH_EXPRESSION answers', () => {
    const answer: AnswerData = { type: 'MATH_EXPRESSION', latex: '2x+2', mathjson: '["Add",["Multiply",2,"x"],2]' };
    const payload = toApiPayload(answer, 2);
    expect(fromApiPayload(QUESTION_TYPE_KEY.MATH_EXPRESSION, payload, question)).toEqual({
      type: 'MATH_EXPRESSION',
      latex: '2x+2'
    });
  });

  it('rejects empty or malformed MATH_EXPRESSION payloads', () => {
    for (const answer of [
      '',
      'not json',
      '{"type":"MATH_EXPRESSION","latex":"  "}',
      '{"type":"NUMERIC","latex":"1"}'
    ]) {
      expect(fromApiPayload(QUESTION_TYPE_KEY.MATH_EXPRESSION, { questionId: 2, answer }, question)).toBeNull();
    }
  });

  it('round-trips WORKED_SOLUTION answers without signed file urls', () => {
    const answer: AnswerData = {
      type: 'WORKED_SOLUTION',
      latex: '4',
      working: {
        lines: ['2x=8'],
        files: [{ kind: 'photo', fileKey: 'k1', fileName: 'work.jpg', fileUrl: 'https://signed.example/k1' }]
      }
    };
    const payload = toApiPayload(answer, 3);
    expect(payload.answer).not.toContain('signed.example');
    expect(fromApiPayload(QUESTION_TYPE_KEY.WORKED_SOLUTION, payload, workedQuestion({}))).toEqual({
      type: 'WORKED_SOLUTION',
      latex: '4',
      working: { lines: ['2x=8'], files: [{ kind: 'photo', fileKey: 'k1', fileName: 'work.jpg' }] }
    });
  });

  it('accepts working without a final answer, and rejects an empty worked solution', () => {
    const decode = (answer: string) =>
      fromApiPayload(QUESTION_TYPE_KEY.WORKED_SOLUTION, { questionId: 3, answer }, workedQuestion({}));
    expect(decode('{"type":"WORKED_SOLUTION","working":{"lines":["2x=8"]}}')).toEqual({
      type: 'WORKED_SOLUTION',
      latex: '',
      working: { lines: ['2x=8'], files: [] }
    });
    expect(decode('{"type":"WORKED_SOLUTION","latex":"","working":{}}')).toBeNull();
  });

  it('keeps the typed LaTeX of NUMERIC answers and reads legacy payloads', () => {
    const numeric = numericQuestion({});
    expect(
      fromApiPayload(
        QUESTION_TYPE_KEY.NUMERIC,
        toApiPayload({ type: 'NUMERIC', value: 0.75, latex: '3/4' }, 1),
        numeric
      )
    ).toEqual({
      type: 'NUMERIC',
      value: 0.75,
      latex: '3/4'
    });
    expect(
      fromApiPayload(QUESTION_TYPE_KEY.NUMERIC, { questionId: 1, answer: '{"type":"NUMERIC","value":5}' }, numeric)
    ).toEqual({
      type: 'NUMERIC',
      value: 5
    });
  });
});
