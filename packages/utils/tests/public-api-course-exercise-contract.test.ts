import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAddExerciseQuestion,
  ZPublicApiAddExerciseSection,
  ZPublicApiCourseExerciseDetailResponse,
  ZPublicApiForceQuery,
  ZPublicApiExerciseQuestionParam,
  ZPublicApiExerciseQuestionResponse,
  ZPublicApiExerciseSectionParam,
  ZPublicApiExerciseSectionResponse,
  ZPublicApiUpdateExerciseQuestionFields,
  ZPublicApiUpdateExerciseSectionFields,
  ZPublicApiCourseExerciseNotifyStatusQuery,
  ZPublicApiCourseExercisesQuery,
  ZPublicApiCourseMarksQuery,
  ZPublicApiCourseSubmissionsQuery,
  ZPublicApiCreateCourseExercise,
  ZPublicApiExerciseTemplatesQuery,
  ZPublicApiGradeCourseSubmission,
  ZPublicApiUpdateCourseExercise,
  ZPublicApiUpdateCourseSubmission
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiCourseExercisesQuery,
  ZPublicApiCreateCourseExercise,
  ZPublicApiUpdateCourseExercise,
  ZPublicApiCourseExerciseNotifyStatusQuery,
  ZPublicApiExerciseTemplatesQuery,
  ZPublicApiCourseSubmissionsQuery,
  ZPublicApiGradeCourseSubmission,
  ZPublicApiUpdateCourseSubmission,
  ZPublicApiCourseMarksQuery,
  ZPublicApiExerciseQuestionParam,
  ZPublicApiAddExerciseQuestion,
  ZPublicApiUpdateExerciseQuestionFields,
  ZPublicApiForceQuery,
  ZPublicApiExerciseSectionParam,
  ZPublicApiAddExerciseSection,
  ZPublicApiUpdateExerciseSectionFields
};

const responseSchemas = {
  ZPublicApiExerciseQuestionResponse,
  ZPublicApiExerciseSectionResponse,
  ZPublicApiCourseExerciseDetailResponse
};

const choice = (options: Array<{ label: string; isCorrect: boolean }>) => ({
  question: 'Pick one',
  questionTypeId: 1,
  points: 1,
  options
});

describe('public API course exercise request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('keeps the create rules that are not visible in the JSON shape', () => {
    expect(ZPublicApiCreateCourseExercise.safeParse({ title: 'Quiz', order: 1 }).success).toBe(true);
    expect(ZPublicApiCreateCourseExercise.safeParse({ order: 1, templateId: 3 }).success).toBe(true);
    expect(ZPublicApiCreateCourseExercise.safeParse({ order: 1 }).success).toBe(false);
    expect(ZPublicApiCreateCourseExercise.safeParse({ title: 'Quiz', order: 1, templateId: 3 }).success).toBe(false);
    expect(
      ZPublicApiCreateCourseExercise.safeParse({
        title: 'Quiz',
        order: 1,
        questions: [{ question: 'Q', questionTypeId: 15, points: 1 }]
      }).success
    ).toBe(false);
    expect(
      ZPublicApiCreateCourseExercise.safeParse({
        title: 'Quiz',
        order: 1,
        questions: [
          choice([
            { label: 'A', isCorrect: false },
            { label: 'B', isCorrect: false }
          ])
        ]
      }).success
    ).toBe(false);
  });

  it('keeps the update rules that are not visible in the JSON shape', () => {
    expect(ZPublicApiUpdateCourseExercise.safeParse({}).success).toBe(false);
    expect(
      ZPublicApiUpdateCourseExercise.safeParse({ questions: [{ question: 'Q', points: 1, delete: true }] }).success
    ).toBe(false);
    expect(
      ZPublicApiUpdateCourseExercise.safeParse({
        questions: [
          {
            ...choice([
              { label: 'A', isCorrect: true },
              { label: 'B', isCorrect: false },
              { label: 'C', isCorrect: true }
            ]),
            options: [
              { id: 1, label: 'A', isCorrect: true, delete: true },
              { id: 2, label: 'B', isCorrect: false }
            ]
          }
        ]
      }).success
    ).toBe(false);
    expect(
      ZPublicApiUpdateCourseExercise.safeParse({
        questions: [{ id: 1, ...choice([]), options: [{ id: 2, label: 'B, reworded', isCorrect: false }] }]
      }).success
    ).toBe(true);
  });

  it('keeps the submission rules that are not visible in the JSON shape', () => {
    expect(ZPublicApiUpdateCourseSubmission.safeParse({}).success).toBe(false);
    expect(
      ZPublicApiGradeCourseSubmission.safeParse({
        answers: [
          { questionId: 1, points: 1 },
          { questionId: 1, points: 2 }
        ],
        total: 3
      }).success
    ).toBe(false);
  });

  it('treats a question or option with an id as a partial edit', () => {
    const update = (questions: unknown[]) => ZPublicApiUpdateCourseExercise.safeParse({ questions }).success;

    expect(update([{ id: 5, delete: true }])).toBe(true);
    expect(update([{ id: 5, order: 3 }])).toBe(true);
    expect(update([{ id: 5, options: [{ id: 9, delete: true }] }])).toBe(true);
    expect(update([{ id: 5, options: [{ id: 9, label: 'Renamed' }] }])).toBe(true);
  });

  it('still needs a new question or option to be complete', () => {
    const update = (questions: unknown[]) => ZPublicApiUpdateCourseExercise.safeParse({ questions }).success;

    expect(update([{ question: 'Q', questionTypeId: 3 }])).toBe(false);
    expect(update([{ points: 1, questionTypeId: 3 }])).toBe(false);
    expect(update([{ question: 'Q', points: 1, questionTypeId: 3 }])).toBe(true);
    expect(update([{ id: 5, options: [{ label: 'New' }] }])).toBe(false);
    expect(update([{ id: 5, options: [{ isCorrect: true }] }])).toBe(false);
    expect(update([{ id: 5, options: [{ delete: true }] }])).toBe(false);
    expect(update([{ id: 5, options: [{ label: 'New', isCorrect: false }] }])).toBe(true);
    expect(update([{ delete: true }])).toBe(false);
  });

  it('judges a new question with no type as the RADIO question it is stored as', () => {
    const update = (questions: unknown[]) => ZPublicApiUpdateCourseExercise.safeParse({ questions }).success;
    const options = (correct: boolean[]) =>
      correct.map((isCorrect, index) => ({ label: `Option ${index}`, isCorrect }));

    expect(update([{ question: 'Q', points: 1, options: options([true]) }])).toBe(false);
    expect(update([{ question: 'Q', points: 1, options: options([false, false]) }])).toBe(false);
    expect(update([{ question: 'Q', points: 1, options: options([true, false]) }])).toBe(true);
  });
});

describe('public API exercise question and section contract', () => {
  it.each(Object.entries(responseSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('rejects an empty question or section edit', () => {
    expect(ZPublicApiUpdateExerciseQuestionFields.safeParse({}).success).toBe(false);
    expect(ZPublicApiUpdateExerciseSectionFields.safeParse({}).success).toBe(false);
  });

  it('rejects an option id that is both updated and removed', () => {
    expect(
      ZPublicApiUpdateExerciseQuestionFields.safeParse({ updateOptions: [{ id: 5, label: 'A' }], removeOptionIds: [5] })
        .success
    ).toBe(false);
    expect(
      ZPublicApiUpdateExerciseQuestionFields.safeParse({ updateOptions: [{ id: 5, label: 'A' }], removeOptionIds: [6] })
        .success
    ).toBe(true);
  });

  it('keeps the option rules on an added question', () => {
    expect(ZPublicApiAddExerciseQuestion.safeParse(choice([{ label: 'A', isCorrect: false }])).success).toBe(false);
    expect(
      ZPublicApiAddExerciseQuestion.safeParse(
        choice([
          { label: 'A', isCorrect: true },
          { label: 'B', isCorrect: false }
        ])
      ).success
    ).toBe(true);
  });

  it('reads force from the query string and defaults it to false', () => {
    expect(ZPublicApiForceQuery.parse({})).toEqual({ force: false });
    expect(ZPublicApiForceQuery.parse({ force: 'true' })).toEqual({ force: true });
    expect(ZPublicApiForceQuery.parse({ force: 'false' })).toEqual({ force: false });
  });
});

describe('public API bulk exercise update section rules', () => {
  const update = (sections: unknown[]) => ZPublicApiUpdateCourseExercise.safeParse({ sections }).success;

  it('needs title and order for a new section only', () => {
    expect(update([{ title: 'Part 2', order: 1 }])).toBe(true);
    expect(update([{ title: 'Part 2' }])).toBe(false);
    expect(update([{ id: '11111111-1111-4111-8111-111111111111', title: 'Renamed' }])).toBe(true);
  });

  it('needs an id to remove a section', () => {
    expect(update([{ delete: true }])).toBe(false);
    expect(update([{ id: '11111111-1111-4111-8111-111111111111', delete: true }])).toBe(true);
  });
});
