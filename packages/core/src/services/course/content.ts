import { AppError, ErrorCodes } from '@cio/utils/errors';
import { ContentType } from '@cio/utils/constants';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { db } from '@cio/db/drizzle';
import { applyCourseContentBulkUpdates, applyCourseSectionOrderUpdates } from '@cio/db/queries/course/content-batch';
import { deleteCourseSection, getCourseSectionById, getCourseSectionsByCourseId } from '@cio/db/queries/course';
import { OperationalQueryError } from '@cio/db/queries/query-errors';
import { getCourseContentItems, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { deleteLesson } from '@cio/db/queries/lesson';
import { deleteExercise } from '@cio/db/queries/exercise/exercise';
import type { TCourseContentDelete, TCourseContentReorder, TCourseContentUpdate } from '@cio/utils/validation/course';

type CourseContentReorderResult = {
  courseId: string;
  updatedSections: number;
  updatedItems: number;
  updatedLessons: number;
  updatedExercises: number;
};

function buildContentKey(item: { id: string; type: string }) {
  return `${item.type}-${item.id}`;
}

function normalizeDeleteItems<TItem extends { id: string; type: string }>(items: TItem[]): TItem[] {
  const seenKeys = new Set<string>();
  const uniqueItems: TItem[] = [];

  for (const item of items) {
    const itemKey = buildContentKey(item);
    if (seenKeys.has(itemKey)) {
      continue;
    }

    seenKeys.add(itemKey);
    uniqueItems.push(item);
  }

  const exercises = uniqueItems.filter((item) => item.type === ContentType.Exercise);
  const lessons = uniqueItems.filter((item) => item.type === ContentType.Lesson);

  return [...exercises, ...lessons];
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

async function assertCourseSections(courseId: string, sections: NonNullable<TCourseContentReorder['sections']>) {
  const existingSections = await getCourseSectionsByCourseId(courseId);
  const sectionIds = new Set(existingSections.map((section) => section.id));

  sections.forEach((section) => {
    if (!sectionIds.has(section.id)) {
      throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
    }
  });
}

function mapContentBatchError(error: unknown): AppError | null {
  if (error instanceof OperationalQueryError) {
    return new AppError(error.message, error.errorCode, error.statusCode, error.field);
  }

  return null;
}

async function transactionWithContentBatch<TResult>(runner: (tx: DbOrTxClient) => Promise<TResult>): Promise<TResult> {
  try {
    return await db.transaction(async (tx) => runner(tx));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const mapped = mapContentBatchError(error);

    if (mapped) {
      throw mapped;
    }

    throw error;
  }
}

export async function updateCourseContent(courseId: string, items: TCourseContentUpdate['items']) {
  try {
    await assertCourseContentItems(courseId, items);

    await transactionWithContentBatch(async (tx) => applyCourseContentBulkUpdates(tx, items));
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

export async function reorderCourseContent(
  courseId: string,
  payload: TCourseContentReorder
): Promise<CourseContentReorderResult> {
  try {
    if (payload.sections?.length) {
      await assertCourseSections(courseId, payload.sections);
    }

    if (payload.items?.length) {
      await assertCourseContentItems(courseId, payload.items);
    }

    return await transactionWithContentBatch(async (tx) => {
      const updatedSections = payload.sections?.length ? await applyCourseSectionOrderUpdates(tx, payload.sections) : 0;

      const itemResult = payload.items?.length
        ? await applyCourseContentBulkUpdates(tx, payload.items)
        : {
            updatedItems: 0,
            updatedLessons: 0,
            updatedExercises: 0
          };

      return {
        courseId,
        updatedSections,
        ...itemResult
      };
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reorder course content',
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
      const itemsToDelete = normalizeDeleteItems(
        contentItems.filter(
          (item) =>
            (item.type === ContentType.Lesson || item.type === ContentType.Exercise) && item.sectionId === sectionId
        )
      );

      console.log('Items to delete:', itemsToDelete);
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
            console.log('delete exercise failed for id:', item.id);
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
    const normalizedItems = normalizeDeleteItems(items);

    await db.transaction(async (tx) => {
      for (const item of normalizedItems) {
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
