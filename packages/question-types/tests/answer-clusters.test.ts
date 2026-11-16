import { describe, expect, it } from 'vitest';

import {
  QUESTION_TYPE_KEY,
  readClusterOverrides,
  scoreAnswerForQuestion,
  withClusterOverride,
  withoutClusterOverride,
  type AnswerData,
  type ExerciseQuestionModel
} from '../src';
import { buildAnswerClusters, getAnswerClusterKey, isClusterableQuestionType } from '../src/answer-clusters';
import { mathGrader } from '../src/math-grading';

const mathQuestion = (settings: Record<string, unknown> = {}): ExerciseQuestionModel => ({
  id: 1,
  title: 'Solve',
  questionType: QUESTION_TYPE_KEY.MATH_EXPRESSION,
  points: 2,
  options: [],
  settings: { acceptedAnswers: ['x=-3'], ...settings }
});

const math = (latex: string, extra: Partial<AnswerData> = {}): AnswerData =>
  ({ type: 'MATH_EXPRESSION', latex, ...extra }) as AnswerData;

describe('getAnswerClusterKey for math', () => {
  it.each([
    ['x=-3', 'x = -3'],
    ['x=-3', '-3=x'.replace('-3=x', 'x=-3')],
    ['x=-3', 'x=-3.0'],
    ['x=-3', 'x=-\\frac{6}{2}'],
    ['x=-3', 'x=-(3)'],
    ['\\frac{1}{2}', '\\frac12'],
    ['\\frac{1}{2}', '\\dfrac{1}{2}'],
    ['x^2', 'x^{2}'],
    ['a+b', 'b+a'],
    ['2x', '2\\cdot x']
  ])('groups %s with %s', (first, second) => {
    const question = mathQuestion();

    expect(getAnswerClusterKey(question, math(first))).toBe(getAnswerClusterKey(question, math(second)));
  });

  it.each([
    ['x=-3', 'x=3'],
    ['\\frac{1}{2}', '\\frac{1}{3}'],
    ['x^2', 'x^3']
  ])('separates %s from %s', (first, second) => {
    const question = mathQuestion();

    expect(getAnswerClusterKey(question, math(first))).not.toBe(getAnswerClusterKey(question, math(second)));
  });

  it('returns null for a blank answer and a seed-prefixed key for a variant', () => {
    const question = mathQuestion();

    expect(getAnswerClusterKey(question, math('  '))).toBeNull();
    expect(getAnswerClusterKey(question, null)).toBeNull();
    expect(getAnswerClusterKey(question, math('x=3', { seed: 'abc' }))).toMatch(/^seed:abc\|math:/);
  });
});

describe('getAnswerClusterKey for other types', () => {
  const numeric: ExerciseQuestionModel = {
    ...mathQuestion(),
    questionType: QUESTION_TYPE_KEY.NUMERIC,
    settings: { correctValue: 0.5 }
  };

  it('groups numeric answers by value however they were typed', () => {
    const keys = [
      { type: 'NUMERIC', value: 0.5 },
      { type: 'NUMERIC', value: 0.5, latex: '\\frac{1}{2}' },
      { type: 'NUMERIC', value: 0.5, latex: '0.50' },
      { type: 'NUMERIC', value: 0.5, latex: '\\frac{2}{4}' }
    ].map((answer) => getAnswerClusterKey(numeric, answer as AnswerData));

    expect(new Set(keys).size).toBe(1);
  });

  it('groups choices by option, text by trimmed lowercase and checkboxes regardless of order', () => {
    const radio = { ...mathQuestion(), questionType: QUESTION_TYPE_KEY.RADIO };
    const shortAnswer = { ...mathQuestion(), questionType: QUESTION_TYPE_KEY.SHORT_ANSWER };

    expect(getAnswerClusterKey(radio, { type: 'RADIO', optionId: 4 })).toBe('option:4');
    expect(getAnswerClusterKey(radio, { type: 'CHECKBOX', optionIds: [3, 1] })).toBe(
      getAnswerClusterKey(radio, { type: 'CHECKBOX', optionIds: [1, 3] })
    );
    expect(getAnswerClusterKey(shortAnswer, { type: 'SHORT_ANSWER', text: '  Paris ' })).toBe(
      getAnswerClusterKey(shortAnswer, { type: 'SHORT_ANSWER', text: 'paris' })
    );
    expect(getAnswerClusterKey(shortAnswer, { type: 'SHORT_ANSWER', text: '   ' })).toBeNull();
  });

  it('does not cluster paragraph or file answers', () => {
    expect(isClusterableQuestionType(QUESTION_TYPE_KEY.TEXTAREA)).toBe(false);
    expect(isClusterableQuestionType(QUESTION_TYPE_KEY.MATH_EXPRESSION)).toBe(true);
  });
});

describe('buildAnswerClusters', () => {
  it('counts equivalent forms together, largest first, with the grade and any override', () => {
    const question = mathQuestion({
      clusterOverrides: [
        {
          key: getAnswerClusterKey(mathQuestion(), math('x=3')),
          label: '$x=3$',
          verdict: 'wrong',
          setBy: 'p',
          setAt: 't'
        }
      ]
    });
    const entry = (latex: string, points: number, name: string) => ({
      submissionId: name,
      studentId: name,
      studentName: name,
      answer: math(latex),
      points
    });

    const clusters = buildAnswerClusters(question, [
      entry('x=-3', 2, 'a'),
      entry('x = -3', 2, 'b'),
      entry('x=-3.0', 2, 'c'),
      entry('x=3', 0, 'd'),
      entry('x=3', 0, 'e')
    ]);

    expect(clusters.map((cluster) => cluster.count)).toEqual([3, 2]);
    expect(clusters[0]).toMatchObject({ grade: 'full', points: 2, override: null });
    expect(clusters[1]).toMatchObject({ grade: 'wrong', points: 0 });
    expect(clusters[1].override?.verdict).toBe('wrong');
  });

  it('reports mixed when members hold different points', () => {
    const question = mathQuestion();
    const clusters = buildAnswerClusters(question, [
      { submissionId: 'a', studentId: 'a', studentName: 'A', answer: math('x=1'), points: 0 },
      { submissionId: 'b', studentId: 'b', studentName: 'B', answer: math('x=1'), points: 1.5 }
    ]);

    expect(clusters[0]).toMatchObject({ grade: 'mixed', points: null });
  });
});

describe('cluster overrides', () => {
  const rule = (verdict: 'correct' | 'partial' | 'wrong', points?: number) => ({
    key: 'k',
    label: '$x=3$',
    verdict,
    points,
    setBy: 'teacher',
    setAt: '2026-11-16T00:00:00.000Z'
  });
  const stamped = (verdict: 'correct' | 'partial' | 'wrong', points?: number): AnswerData =>
    math('x=3', { clusterOverride: rule(verdict, points) });

  it('scores a stamped answer by its verdict, ignoring the grader', () => {
    const question = mathQuestion();

    expect(scoreAnswerForQuestion(question, stamped('correct'), mathGrader)).toBe(2);
    expect(scoreAnswerForQuestion(question, stamped('wrong'), mathGrader)).toBe(0);
    expect(scoreAnswerForQuestion(question, stamped('partial', 0.67), mathGrader)).toBe(0.67);
    expect(scoreAnswerForQuestion(question, stamped('partial', 9), mathGrader)).toBe(2);
    expect(scoreAnswerForQuestion(mathQuestion({ acceptedAnswers: ['x=3'] }), stamped('wrong'), mathGrader)).toBe(0);
  });

  it('keeps the grader score when the stamp only carries feedback', () => {
    const feedbackOnly = math('x=-3', {
      clusterOverride: { key: 'k', feedback: 'Check the sign', setBy: 't', setAt: 't' }
    });

    expect(scoreAnswerForQuestion(mathQuestion(), feedbackOnly, mathGrader)).toBe(2);
  });

  it('adds, replaces and removes rules in the settings', () => {
    const added = withClusterOverride({ acceptedAnswers: ['1'] }, rule('correct'));
    const replaced = withClusterOverride(added, rule('wrong'));

    expect(readClusterOverrides(replaced)).toHaveLength(1);
    expect(readClusterOverrides(replaced)[0].verdict).toBe('wrong');
    expect(withoutClusterOverride(replaced, 'k')).toEqual({ acceptedAnswers: ['1'] });
    expect(readClusterOverrides({ clusterOverrides: 'nope' })).toEqual([]);
  });
});
