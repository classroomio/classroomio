import { describe, expect, it } from 'vitest';

import { dbQuestionToExerciseQuestionModel, scoreAnswerForQuestion } from '../src/question-scoring';
import { mathGrader } from '../src/math-grading';
import { QUESTION_TYPE_KEY } from '../src/question-type-keys';
import { QUESTION_TYPE_IDS } from '../src/question-type-registry';
import { createSeededRandom, readQuestionParameters } from '../src/variant-settings';
import { previewVariants } from '../src/variant-preview';
import { instantiateQuestion, instantiateVariant } from '../src/variants';

const MATH = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.MATH_EXPRESSION];
const NUMERIC = QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.NUMERIC];

const divisionQuestion = {
  title: 'Compute $\\frac{{{b}}}{{{a}}}$ for a = {{a}}',
  settings: {
    acceptedAnswers: ['{{answer}}'],
    parameters: {
      variables: [
        { name: 'a', type: 'int', min: 2, max: 9, step: 1 },
        { name: 'b', type: 'int', min: 1, max: 20, step: 1 }
      ],
      constraints: [],
      answerFormula: 'b / a'
    }
  },
  options: []
};

describe('seeded random', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = createSeededRandom('seed-1');
    const second = createSeededRandom('seed-1');

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('differs between seeds and stays in [0, 1)', () => {
    const numbers = Array.from({ length: 50 }, (_, index) => createSeededRandom('s' + index)());

    expect(new Set(numbers).size).toBeGreaterThan(40);
    expect(numbers.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe('instantiateVariant', () => {
  const parameters = readQuestionParameters(divisionQuestion.settings)!;

  it('is deterministic per seed and stays inside the ranges', () => {
    const first = instantiateVariant(parameters, 'abc');

    expect(instantiateVariant(parameters, 'abc')).toEqual(first);
    expect(first.values.a).toBeGreaterThanOrEqual(2);
    expect(first.values.a).toBeLessThanOrEqual(9);
    expect(first.values.b).toBeGreaterThanOrEqual(1);
    expect(first.values.b).toBeLessThanOrEqual(20);
  });

  it('computes the exact answer from the formula', () => {
    const fixed = readQuestionParameters({
      parameters: {
        variables: [
          { name: 'a', type: 'int', min: 6, max: 6 },
          { name: 'b', type: 'int', min: 4, max: 4 }
        ],
        answerFormula: 'b / a'
      }
    })!;

    expect(instantiateVariant(fixed, 'any').answer).toBe('\\frac{2}{3}');
  });

  it('honours constraints, integer and nonzero answers', () => {
    const constrained = readQuestionParameters({
      parameters: {
        variables: [
          { name: 'a', type: 'int', min: -5, max: 5, step: 1 },
          { name: 'b', type: 'int', min: -20, max: 20, step: 1 }
        ],
        constraints: ['a != 0', 'b > a'],
        answerFormula: 'b / a',
        requireIntegerAnswer: true,
        requireNonzeroAnswer: true
      }
    })!;

    for (let index = 0; index < 40; index++) {
      const { values, satisfiesConstraints } = instantiateVariant(constrained, 'k' + index);

      expect(satisfiesConstraints).toBe(true);
      expect(values.a).not.toBe(0);
      expect(values.b).toBeGreaterThan(values.a);
      expect(values.b % values.a).toBe(0);
      expect(values.b).not.toBe(0);
    }
  });

  it('reports unsatisfiable constraints', () => {
    const impossible = readQuestionParameters({
      parameters: {
        variables: [{ name: 'a', type: 'int', min: 1, max: 3, step: 1 }],
        constraints: ['a > 10']
      }
    })!;

    expect(instantiateVariant(impossible, 'x').satisfiesConstraints).toBe(false);
  });

  it('supports decimal and choice variables', () => {
    const mixed = readQuestionParameters({
      parameters: {
        variables: [
          { name: 'x', type: 'decimal', min: 0.5, max: 2, step: 0.5 },
          { name: 'n', type: 'choice', min: 0, max: 0, step: 1, choices: [10, 100, 1000] }
        ]
      }
    })!;
    const { values } = instantiateVariant(mixed, 'm');

    expect([0.5, 1, 1.5, 2]).toContain(values.x);
    expect([10, 100, 1000]).toContain(values.n);
  });
});

describe('instantiateQuestion', () => {
  it('fills placeholders and formulas in the title, options and settings', () => {
    const question = {
      title: 'Add {{a}} and {{b}}: {{a + b}}',
      options: [{ label: '{{a * b}}' }, { label: 'none' }],
      settings: {
        description: '<p>{{a}}</p>',
        parameters: { variables: [{ name: 'a', type: 'int', min: 3, max: 3 }, { name: 'b', type: 'int', min: 4, max: 4 }] }
      }
    };
    const filled = instantiateQuestion(question, 's');

    expect(filled.title).toBe('Add 3 and 4: 7');
    expect(filled.options?.map((option) => option.label)).toEqual(['12', 'none']);
    expect(filled.settings.description).toBe('<p>3</p>');
    expect(filled.settings.parameters).toEqual(question.settings.parameters);
  });

  it('returns a question without parameters unchanged', () => {
    const plain = { title: 'x {{a}}', settings: {}, options: [] };

    expect(instantiateQuestion(plain, 's')).toBe(plain);
  });
});

describe('grading with a seed', () => {
  function gradeWith(seed: string, latex: string): number {
    const question = {
      id: 1,
      title: divisionQuestion.title,
      questionTypeId: MATH,
      points: 1,
      settings: divisionQuestion.settings,
      options: []
    };
    const instantiated = instantiateQuestion(question, seed);

    return scoreAnswerForQuestion(
      dbQuestionToExerciseQuestionModel(instantiated),
      { type: 'MATH_EXPRESSION', latex },
      mathGrader
    );
  }

  it('grades the answer computed for that seed and not another seed', () => {
    const parameters = readQuestionParameters(divisionQuestion.settings)!;
    const seedOne = 'one';
    const seedTwo = Array.from({ length: 50 }, (_, index) => 'two' + index).find(
      (candidate) => instantiateVariant(parameters, candidate).answer !== instantiateVariant(parameters, seedOne).answer
    )!;
    const answerOne = instantiateVariant(parameters, seedOne).answer!;
    const answerTwo = instantiateVariant(parameters, seedTwo).answer!;

    expect(gradeWith(seedOne, answerOne)).toBe(1);
    expect(gradeWith(seedOne, answerTwo)).toBe(0);
    expect(gradeWith(seedTwo, answerTwo)).toBe(1);
  });

  it('grades a NUMERIC correctValue placeholder', () => {
    const settings = {
      correctValue: '{{answer}}',
      parameters: {
        variables: [{ name: 'a', type: 'int', min: 4, max: 4 }, { name: 'b', type: 'int', min: 3, max: 3 }],
        answerFormula: 'a * b'
      }
    };
    const instantiated = instantiateQuestion({ id: 1, title: 'q', questionTypeId: NUMERIC, points: 2, settings, options: [] }, 's');
    const model = dbQuestionToExerciseQuestionModel(instantiated);

    expect(scoreAnswerForQuestion(model, { type: 'NUMERIC', value: 12 }, mathGrader)).toBe(2);
    expect(scoreAnswerForQuestion(model, { type: 'NUMERIC', value: 7 }, mathGrader)).toBe(0);
  });
});

describe('previewVariants', () => {
  it('returns five instances with computed answers and no issues for a sound question', () => {
    const preview = previewVariants({ ...divisionQuestion, questionTypeId: MATH, points: 1 });

    expect(preview).toHaveLength(5);
    expect(preview.every((entry) => entry.issues.length === 0 && entry.answer)).toBe(true);
  });

  it('flags instances whose key fails the verifier', () => {
    const broken = {
      ...divisionQuestion,
      questionTypeId: MATH,
      points: 1,
      settings: { ...divisionQuestion.settings, acceptedAnswers: ['{{a +}}'] }
    };

    expect(previewVariants(broken).every((entry) => entry.issues.length > 0)).toBe(true);
  });
});
