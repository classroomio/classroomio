import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseLearnerExerciseParam,
  ZPublicApiCourseLearnerLessonParam,
  ZPublicApiCreateLearnerSubmission,
  ZPublicApiLearnerLessonCompletionResponse,
  ZPublicApiSetLearnerLessonCompletion
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const schemas = {
  ZPublicApiCourseLearnerLessonParam,
  ZPublicApiSetLearnerLessonCompletion,
  ZPublicApiCourseLearnerExerciseParam,
  ZPublicApiCreateLearnerSubmission,
  ZPublicApiLearnerLessonCompletionResponse
};

describe('public API course learner contract', () => {
  it.each(Object.entries(schemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('needs at least one answer', () => {
    expect(ZPublicApiCreateLearnerSubmission.safeParse({ answers: [] }).success).toBe(false);
    expect(ZPublicApiCreateLearnerSubmission.safeParse({ answers: [{ questionId: 7, optionId: 70 }] }).success).toBe(
      true
    );
  });

  it('rejects a questionId that appears twice', () => {
    expect(
      ZPublicApiCreateLearnerSubmission.safeParse({
        answers: [
          { questionId: 7, optionId: 70 },
          { questionId: 7, optionId: 71 }
        ]
      }).success
    ).toBe(false);
  });
});
