import { beforeEach, describe, expect, it, vi } from 'vitest';

const TX = { tx: true };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));
vi.mock('@cio/db/queries/exercise', () => ({
  getExerciseById: vi.fn(),
  getExerciseSectionsByExerciseId: vi.fn(),
  getQuestionsByExerciseIds: vi.fn(),
  updateExerciseSection: vi.fn(),
  deleteExerciseSectionsByIds: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ touchCourseUpdatedAt: vi.fn() }));

import {
  deleteExerciseSectionsByIds,
  getExerciseById,
  getExerciseSectionsByExerciseId,
  getQuestionsByExerciseIds,
  updateExerciseSection
} from '@cio/db/queries/exercise';
import { deleteExerciseSectionService, updateExerciseSectionService } from '@cio/core/services/exercise/exercise';

const EXERCISE_ID = 'exercise-1';
const PART_1 = 'section-1';
const PART_2 = 'section-2';

const sections = (...behaviors: Array<Record<string, unknown>>) =>
  vi
    .mocked(getExerciseSectionsByExerciseId)
    .mockResolvedValue(
      [PART_1, PART_2].map((id, index) => ({ id, afterBehavior: behaviors[index] ?? { action: 'continue' } })) as never
    );

beforeEach(() => {
  vi.clearAllMocks();
  sections();
  vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 10, exerciseSectionId: PART_1 }] as never);
  vi.mocked(updateExerciseSection).mockResolvedValue({ id: PART_2 } as never);
  vi.mocked(getExerciseById).mockResolvedValue({ courseId: 'course-1' } as never);
});

describe('updateExerciseSectionService', () => {
  it('writes only the fields sent', async () => {
    await updateExerciseSectionService(EXERCISE_ID, PART_2, { order: 3, colorTheme: 'rose' });

    expect(updateExerciseSection).toHaveBeenCalledWith(PART_2, { order: 3, colorTheme: 'rose' });
  });

  it('returns 404 for a section of another exercise', async () => {
    await expect(updateExerciseSectionService(EXERCISE_ID, 'other', { order: 1 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(updateExerciseSection).not.toHaveBeenCalled();
  });

  it('refuses a go_to_section target that is itself or not on the exercise', async () => {
    for (const target of [PART_2, 'other']) {
      await expect(
        updateExerciseSectionService(EXERCISE_ID, PART_2, {
          afterBehavior: { action: 'go_to_section', exerciseSectionId: target }
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    }
    expect(updateExerciseSection).not.toHaveBeenCalled();
  });
});

describe('deleteExerciseSectionService', () => {
  it('deletes an empty section nothing goes to, in one transaction', async () => {
    await deleteExerciseSectionService(EXERCISE_ID, PART_2);

    expect(deleteExerciseSectionsByIds).toHaveBeenCalledWith([PART_2], TX);
  });

  it('returns 409 while the section holds questions', async () => {
    await expect(deleteExerciseSectionService(EXERCISE_ID, PART_1)).rejects.toMatchObject({ statusCode: 409 });
    expect(deleteExerciseSectionsByIds).not.toHaveBeenCalled();
  });

  it("returns 409 while another section's afterBehavior goes to it", async () => {
    sections({ action: 'go_to_section', exerciseSectionId: PART_2 });

    await expect(deleteExerciseSectionService(EXERCISE_ID, PART_2)).rejects.toMatchObject({ statusCode: 409 });
    expect(deleteExerciseSectionsByIds).not.toHaveBeenCalled();
  });

  it('returns 404 for a section of another exercise', async () => {
    await expect(deleteExerciseSectionService(EXERCISE_ID, 'other')).rejects.toMatchObject({ statusCode: 404 });
  });
});
