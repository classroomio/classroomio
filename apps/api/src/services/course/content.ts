import { AppError, ErrorCodes } from '@api/utils/errors';
import { ContentType } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { getCourseContentItems, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { deleteLesson, updateLesson } from '@cio/db/queries/lesson';
import { deleteCourseSection, getCourseSectionById } from '@cio/db/queries/course';
import { deleteExercise, updateExercise } from '@cio/db/queries/exercise/exercise';
import type { TCourseContentDelete, TCourseContentUpdate } from '@cio/utils/validation/course';

function buildUpdatePayload(item: TCourseContentUpdate['items'][number]) {
  const payload: Record<string, unknown> = {};

  if (item.isUnlocked !== undefined) {
    payload.isUnlocked = item.isUnlocked;
  }

  if (item.order !== undefined) {
    payload.order = item.order;
  }

  if (item.sectionId !== undefined) {
    payload.sectionId = item.sectionId;
  }

  return payload;
}

function buildContentKey(item: { id: string; type: string }) {
  return `${item.type}-${item.id}`;
}

async function getCourseContentMap(courseId: string) {
  const contentItems = await getCourseContentItems(courseId);
  const contentMap = new Map<string, CourseContentItemRow>();

  contentItems.forEach((item) => {
    if (item.type === ContentType.Lesson || item.type === ContentType.Exercise) {
      contentMap.set(buildContentKey(item), item);
    }
  });

  return contentMap;
}

async function assertCourseContentItems(courseId: string, items: TCourseContentUpdate['items']) {
  const contentMap = await getCourseContentMap(courseId);

  items.forEach((item) => {
    const key = buildContentKey({ id: item.id, type: item.type });

    if (!contentMap.has(key)) {
      if (item.type === ContentType.Lesson) {
        throw new AppError('Lesson does not belong to this course', ErrorCodes.LESSON_NOT_FOUND, 404);
      }

      if (item.type === ContentType.Exercise) {
        throw new AppError('Exercise does not belong to this course', ErrorCodes.EXERCISE_NOT_FOUND, 404);
      }

      throw new AppError('Invalid content type', ErrorCodes.VALIDATION_ERROR, 400);
    }
  });
}

export async function updateCourseContent(courseId: string, items: TCourseContentUpdate['items']) {
  try {
    await assertCourseContentItems(courseId, items);

    await db.transaction(async (tx) => {
      for (const item of items) {
        const payload = buildUpdatePayload(item);
        if (Object.keys(payload).length === 0) {
          continue;
        }

        if (item.type === ContentType.Lesson) {
          const updated = await updateLesson(item.id, payload, tx);
          if (!updated) {
            throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
          }
          continue;
        }

        const updated = await updateExercise(item.id, payload, tx);
        if (!updated) {
          throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
        }
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course content',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function deleteCourseContent(courseId: string, payload: TCourseContentDelete) {
  try {
    if (payload.sectionId) {
      const sectionId = payload.sectionId;
      const section = await getCourseSectionById(sectionId);
      if (!section || section.courseId !== courseId) {
        throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
      }

      const contentItems = await getCourseContentItems(courseId);
      const itemsToDelete = contentItems.filter(
        (item) =>
          (item.type === ContentType.Lesson || item.type === ContentType.Exercise) && item.sectionId === sectionId
      );

      await db.transaction(async (tx) => {
        for (const item of itemsToDelete) {
          if (item.type === ContentType.Lesson) {
            const deleted = await deleteLesson(item.id, tx);
            if (!deleted) {
              throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
            }
            continue;
          }

          const deleted = await deleteExercise(item.id, tx);
          if (!deleted) {
            throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
          }
        }

        const deletedSection = await deleteCourseSection(sectionId, tx);
        if (!deletedSection) {
          throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
        }
      });

      return;
    }

    if (!payload.items) {
      throw new AppError('Content items are required', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const items = payload.items;
    await assertCourseContentItems(courseId, items);

    await db.transaction(async (tx) => {
      for (const item of items) {
        if (item.type === ContentType.Lesson) {
          const deleted = await deleteLesson(item.id, tx);
          if (!deleted) {
            throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
          }
          continue;
        }

        const deleted = await deleteExercise(item.id, tx);
        if (!deleted) {
          throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
        }
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete course content',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
