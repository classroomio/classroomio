import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseStudentExerciseParam,
  ZPublicApiCourseStudentLessonParam,
  ZPublicApiCreateStudentSubmission,
  ZPublicApiStudentLessonCompletionResponse,
  ZPublicApiSetStudentLessonCompletion
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const schemas = {
  ZPublicApiCourseStudentLessonParam,
  ZPublicApiSetStudentLessonCompletion,
  ZPublicApiCourseStudentExerciseParam,
  ZPublicApiCreateStudentSubmission,
  ZPublicApiStudentLessonCompletionResponse
};

describe('public API course student contract', () => {
  it.each(Object.entries(schemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('needs at least one answer', () => {
    expect(ZPublicApiCreateStudentSubmission.safeParse({ answers: [] }).success).toBe(false);
    expect(ZPublicApiCreateStudentSubmission.safeParse({ answers: [{ questionId: 7, optionId: 70 }] }).success).toBe(
      true
    );
  });

  it('rejects a questionId that appears twice', () => {
    expect(
      ZPublicApiCreateStudentSubmission.safeParse({
        answers: [
          { questionId: 7, optionId: 70 },
          { questionId: 7, optionId: 71 }
        ]
      }).success
    ).toBe(false);
  });
});
