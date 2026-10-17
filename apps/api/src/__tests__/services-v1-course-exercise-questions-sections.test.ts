import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/exercises', () => ({
  applyCourseExerciseUpdate: vi.fn(),
  getCourseExerciseService: vi.fn(),
  updateCourseExerciseService: vi.fn()
}));
vi.mock('@cio/db/queries/submission', () => ({ hasQuestionAnswers: vi.fn() }));
vi.mock('@cio/core/services/exercise/exercise', () => ({
  createExerciseSectionService: vi.fn(),
  updateExerciseSectionService: vi.fn(),
  deleteExerciseSectionService: vi.fn()
}));

import { hasQuestionAnswers } from '@cio/db/queries/submission';
import {
  createExerciseSectionService,
  deleteExerciseSectionService,
  updateExerciseSectionService
} from '@cio/core/services/exercise/exercise';
import {
  applyCourseExerciseUpdate,
  getCourseExerciseService,
  updateCourseExerciseService
} from '@api/services/v1/courses/exercises';
import {
  addCourseExerciseQuestionService,
  deleteCourseExerciseQuestionService,
  updateCourseExerciseQuestionService
} from '@api/services/v1/courses/exercise-questions';
import {
  addCourseExerciseSectionService,
  deleteCourseExerciseSectionService,
  updateCourseExerciseSectionService
} from '@api/services/v1/courses/exercise-sections';
import { AppError, ErrorCodes } from '@api/utils/errors';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const SECTION_ID = '33333333-3333-4333-8333-333333333333';
const exerciseParams = { courseId: 'course-1', exerciseId: 'exercise-1' };
const questionParams = { ...exerciseParams, questionId: 10 };
const sectionParams = { ...exerciseParams, sectionId: SECTION_ID };

const question = (id: number) => ({ id, question: `Q${id}`, options: [] });
const section = (id: string) => ({ id, title: 'Part', questionIds: [] });
const detail = (questionIds: number[], sectionIds: string[] = []) =>
  ({ questions: questionIds.map(question), sections: sectionIds.map(section) }) as never;

const newQuestion = {
  question: 'Pick one',
  questionTypeId: 1 as const,
  points: 1,
  options: [
    { label: 'A', isCorrect: true },
    { label: 'B', isCorrect: false }
  ]
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCourseExerciseService).mockResolvedValue(detail([10]));
  vi.mocked(updateCourseExerciseService).mockResolvedValue(detail([10]));
  vi.mocked(hasQuestionAnswers).mockResolvedValue(false);
});

describe('addCourseExerciseQuestionService', () => {
  it('returns the question its own write created, even when another add landed at the same time', async () => {
    vi.mocked(applyCourseExerciseUpdate).mockResolvedValue({
      exercise: detail([10, 11, 12]),
      createdQuestionIds: [11]
    } as never);

    const added = await addCourseExerciseQuestionService(ORG_ID, ACTOR_ID, exerciseParams, newQuestion);

    expect(added).toMatchObject({ id: 11 });
    expect(applyCourseExerciseUpdate).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [newQuestion]
    });
  });

  it('requires a section when the exercise has sections', async () => {
    vi.mocked(getCourseExerciseService).mockResolvedValue(detail([10], [SECTION_ID]));

    await expect(addCourseExerciseQuestionService(ORG_ID, ACTOR_ID, exerciseParams, newQuestion)).rejects.toMatchObject(
      {
        statusCode: 400,
        field: 'exerciseSectionId'
      }
    );
    expect(applyCourseExerciseUpdate).not.toHaveBeenCalled();
  });

  it('passes the access checks of the exercise service on', async () => {
    vi.mocked(getCourseExerciseService).mockRejectedValue(new AppError('Course not found', ErrorCodes.NOT_FOUND, 404));

    await expect(addCourseExerciseQuestionService(ORG_ID, ACTOR_ID, exerciseParams, newQuestion)).rejects.toMatchObject(
      {
        statusCode: 404
      }
    );
    expect(applyCourseExerciseUpdate).not.toHaveBeenCalled();
  });
});

describe('updateCourseExerciseQuestionService', () => {
  it('turns explicit option lists into one question edit that keeps every option not named', async () => {
    await updateCourseExerciseQuestionService(ORG_ID, ACTOR_ID, questionParams, {
      points: 3,
      updateOptions: [{ id: 100, label: 'Renamed' }],
      removeOptionIds: [101],
      addOptions: [{ label: 'C', isCorrect: false }]
    });

    expect(updateCourseExerciseService).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [
        {
          id: 10,
          points: 3,
          options: [
            { id: 100, label: 'Renamed' },
            { id: 101, delete: true },
            { label: 'C', isCorrect: false }
          ]
        }
      ]
    });
  });

  it('sends no options at all when none are named', async () => {
    await updateCourseExerciseQuestionService(ORG_ID, ACTOR_ID, questionParams, { question: 'New text' });

    expect(updateCourseExerciseService).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [{ id: 10, question: 'New text' }]
    });
  });
});

describe('deleteCourseExerciseQuestionService', () => {
  it('deletes an unanswered question and returns it as it was', async () => {
    const deleted = await deleteCourseExerciseQuestionService(ORG_ID, ACTOR_ID, questionParams, { force: false });

    expect(deleted).toMatchObject({ id: 10 });
    expect(updateCourseExerciseService).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [{ id: 10, delete: true }]
    });
  });

  it('refuses an answered question with 409 unless forced', async () => {
    vi.mocked(hasQuestionAnswers).mockResolvedValue(true);

    await expect(
      deleteCourseExerciseQuestionService(ORG_ID, ACTOR_ID, questionParams, { force: false })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(updateCourseExerciseService).not.toHaveBeenCalled();

    await deleteCourseExerciseQuestionService(ORG_ID, ACTOR_ID, questionParams, { force: true });
    expect(updateCourseExerciseService).toHaveBeenCalled();
  });

  it('returns 404 for a question of another exercise before checking answers', async () => {
    await expect(
      deleteCourseExerciseQuestionService(ORG_ID, ACTOR_ID, { ...questionParams, questionId: 99 }, { force: true })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(hasQuestionAnswers).not.toHaveBeenCalled();
    expect(updateCourseExerciseService).not.toHaveBeenCalled();
  });
});

describe('exercise section services', () => {
  it('adds a section after the access check and returns it', async () => {
    vi.mocked(createExerciseSectionService).mockResolvedValue({ id: SECTION_ID } as never);
    vi.mocked(getCourseExerciseService)
      .mockResolvedValueOnce(detail([10]))
      .mockResolvedValueOnce(detail([10], [SECTION_ID]));
    const payload = {
      title: 'Part 2',
      order: 1,
      colorTheme: 'blue' as const,
      afterBehavior: { action: 'continue' as const }
    };

    const added = await addCourseExerciseSectionService(ORG_ID, ACTOR_ID, exerciseParams, payload);

    expect(added).toMatchObject({ id: SECTION_ID });
    expect(createExerciseSectionService).toHaveBeenCalledWith('exercise-1', payload);
  });

  it('does not touch sections when the access check fails', async () => {
    vi.mocked(getCourseExerciseService).mockRejectedValue(new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403));

    await expect(
      updateCourseExerciseSectionService(ORG_ID, ACTOR_ID, sectionParams, { title: 'Renamed' })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteCourseExerciseSectionService(ORG_ID, ACTOR_ID, sectionParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(updateExerciseSectionService).not.toHaveBeenCalled();
    expect(deleteExerciseSectionService).not.toHaveBeenCalled();
  });

  it('edits and deletes a section of this exercise', async () => {
    vi.mocked(getCourseExerciseService).mockResolvedValue(detail([10], [SECTION_ID]));

    await updateCourseExerciseSectionService(ORG_ID, ACTOR_ID, sectionParams, { title: 'Renamed' });
    const deleted = await deleteCourseExerciseSectionService(ORG_ID, ACTOR_ID, sectionParams);

    expect(updateExerciseSectionService).toHaveBeenCalledWith('exercise-1', SECTION_ID, { title: 'Renamed' });
    expect(deleteExerciseSectionService).toHaveBeenCalledWith('exercise-1', SECTION_ID);
    expect(deleted).toMatchObject({ id: SECTION_ID });
  });

  it('returns 404 when deleting a section of another exercise', async () => {
    await expect(deleteCourseExerciseSectionService(ORG_ID, ACTOR_ID, sectionParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(deleteExerciseSectionService).not.toHaveBeenCalled();
  });
});
