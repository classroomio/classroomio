import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
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
  ZPublicApiCourseMarksQuery
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
    // Deleted options don't count towards the per-type option rules.
    expect(
      ZPublicApiUpdateCourseExercise.safeParse({
        questions: [
          {
            id: 1,
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
});
