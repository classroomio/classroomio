import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/course')>()),
  getCourseTypeById: vi.fn()
}));

vi.mock('@cio/db/queries/exercise', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/exercise')>()),
  createExercise: vi.fn()
}));

import { createExerciseFromTemplate } from '@cio/core/services/exercise/exercise';
import { getCourseTypeById } from '@cio/db/queries/course';
import { createExercise } from '@cio/db/queries/exercise';
import { ErrorCodes } from '@cio/utils/errors';

const COURSE_ID = 'course-1';
const TEXTAREA = 3;

const template = (questionTypeIds: number[]) =>
  ({
    title: 'Essay practice',
    description: null,
    questionnaire: {
      questions: questionTypeIds.map((id, index) => ({
        title: `Question ${index + 1}`,
        question_type: { id },
        options: [],
        order: index,
        points: 1
      }))
    }
  }) as never;

describe('createExerciseFromTemplate on a PUBLIC course', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseTypeById).mockResolvedValue('PUBLIC' as never);
  });

  it('rejects a template with a manually graded question before creating anything', async () => {
    await expect(
      createExerciseFromTemplate(COURSE_ID, undefined, undefined, 1, template([TEXTAREA]))
    ).rejects.toMatchObject({
      statusCode: 400,
      code: ErrorCodes.QUESTION_TYPE_NOT_ALLOWED_IN_PUBLIC_COURSE
    });

    expect(getCourseTypeById).toHaveBeenCalledWith(COURSE_ID);
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('rejects when only one of several template questions is manually graded', async () => {
    await expect(
      createExerciseFromTemplate(COURSE_ID, undefined, undefined, 1, template([1, TEXTAREA, 1]))
    ).rejects.toMatchObject({ code: ErrorCodes.QUESTION_TYPE_NOT_ALLOWED_IN_PUBLIC_COURSE });

    expect(createExercise).not.toHaveBeenCalled();
  });
});
