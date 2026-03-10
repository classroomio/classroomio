import { AppError, ErrorCodes } from '@api/utils/errors';
import { ContentType } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { sql, inArray } from 'drizzle-orm';
import { lesson, exercise } from '@cio/db/schema';
import { getCourseContentItems, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { deleteLesson } from '@cio/db/queries/lesson';
import { deleteCourseSection, getCourseSectionById } from '@cio/db/queries/course';
import { deleteExercise } from '@cio/db/queries/exercise/exercise';
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
      const updates = items
        .map((item) => ({
          item,
          payload: buildUpdatePayload(item)
        }))
        .filter(({ payload }) => Object.keys(payload).length > 0);

      if (updates.length === 0) {
        return;
      }

      const updatedAt = new Date().toISOString();

      const lessonUpdates = updates.filter(({ item }) => item.type === ContentType.Lesson);
      const exerciseUpdates = updates.filter(({ item }) => item.type === ContentType.Exercise);

      if (lessonUpdates.length > 0) {
        const lessonIds = lessonUpdates.map(({ item }) => item.id);
        const lessonOrderUpdates = lessonUpdates
          .filter(({ payload }) => payload.order !== undefined)
          .map(({ item, payload }) => ({ id: item.id, value: payload.order }));
        const lessonSectionUpdates = lessonUpdates
          .filter(({ payload }) => payload.sectionId !== undefined)
          .map(({ item, payload }) => ({ id: item.id, value: payload.sectionId }));
        const lessonUnlockUpdates = lessonUpdates
          .filter(({ payload }) => payload.isUnlocked !== undefined)
          .map(({ item, payload }) => ({ id: item.id, value: payload.isUnlocked }));

        const lessonSet: Record<string, unknown> = {
          updatedAt
        };

        if (lessonOrderUpdates.length > 0) {
          lessonSet.order = sql`case ${lesson.id} ${sql.join(
            lessonOrderUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
            sql` `
          )} else ${lesson.order} end`;
        }

        if (lessonSectionUpdates.length > 0) {
          lessonSet.sectionId = sql`case ${lesson.id} ${sql.join(
            lessonSectionUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
            sql` `
          )} else ${lesson.sectionId} end`;
        }

        if (lessonUnlockUpdates.length > 0) {
          lessonSet.isUnlocked = sql`case ${lesson.id} ${sql.join(
            lessonUnlockUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
            sql` `
          )} else ${lesson.isUnlocked} end`;
        }

        const updatedLessons = await tx
          .update(lesson)
          .set(lessonSet)
          .where(inArray(lesson.id, lessonIds))
          .returning({ id: lesson.id });

        if (updatedLessons.length !== lessonIds.length) {
          throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
        }
      }

      if (exerciseUpdates.length > 0) {
        const exerciseIds = exerciseUpdates.map(({ item }) => item.id);
        const exerciseOrderUpdates = exerciseUpdates
          .filter(({ payload }) => payload.order !== undefined)
          .map(({ item, payload }) => ({ id: item.id, value: payload.order }));
        const exerciseSectionUpdates = exerciseUpdates
          .filter(({ payload }) => payload.sectionId !== undefined)
          .map(({ item, payload }) => ({ id: item.id, value: payload.sectionId }));
        const exerciseUnlockUpdates = exerciseUpdates
          .filter(({ payload }) => payload.isUnlocked !== undefined)
          .map(({ item, payload }) => ({ id: item.id, value: payload.isUnlocked }));

        const exerciseSet: Record<string, unknown> = {
          updatedAt
        };

        if (exerciseOrderUpdates.length > 0) {
          exerciseSet.order = sql`case ${exercise.id} ${sql.join(
            exerciseOrderUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
            sql` `
          )} else ${exercise.order} end`;
        }

        if (exerciseSectionUpdates.length > 0) {
          exerciseSet.sectionId = sql`case ${exercise.id} ${sql.join(
            exerciseSectionUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
            sql` `
          )} else ${exercise.sectionId} end`;
        }

        if (exerciseUnlockUpdates.length > 0) {
          exerciseSet.isUnlocked = sql`case ${exercise.id} ${sql.join(
            exerciseUnlockUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
            sql` `
          )} else ${exercise.isUnlocked} end`;
        }

        const updatedExercises = await tx
          .update(exercise)
          .set(exerciseSet)
          .where(inArray(exercise.id, exerciseIds))
          .returning({ id: exercise.id });

        if (updatedExercises.length !== exerciseIds.length) {
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
