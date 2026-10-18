import { AppError, ErrorCodes } from '@cio/utils/errors';
import { ContentType } from '@cio/utils/constants';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { db } from '@cio/db/drizzle';
import { applyCourseContentBulkUpdates, applyCourseSectionOrderUpdates } from '@cio/db/queries/course/content-batch';
import { deleteCourseSection, getCourseSectionById, getCourseSectionsByCourseId } from '@cio/db/queries/course';
import { OperationalQueryError } from '@cio/db/queries/query-errors';
import {
  countContentStudentWork,
  getCourseContentItems,
  type CourseContentItemRow
} from '@cio/db/queries/course/content';
import { deleteLesson } from '@cio/db/queries/lesson';
import { deleteAssetUsagesByTarget } from '@cio/db/queries/assets';
import { deleteExercise } from '@cio/db/queries/exercise/exercise';
import { ZCourseContentReorder } from '@cio/utils/validation/course';
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

/** Applies lock/order/section changes atomically and returns each item as stored afterwards. */
export async function updateCourseContent(
  courseId: string,
  items: TCourseContentUpdate['items']
): Promise<{ items: CourseContentItemRow[] }> {
  try {
    await assertCourseContentItems(courseId, items);

    const storedItems = await transactionWithContentBatch(async (tx) => {
      await applyCourseContentBulkUpdates(tx, items);

      return getCourseContentItems(courseId, undefined, tx);
    });
    const requestedKeys = new Set(items.map(buildContentKey));

    return { items: storedItems.filter((item) => requestedKeys.has(buildContentKey(item))) };
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
    const validation = ZCourseContentReorder.safeParse(payload);
    if (!validation.success) {
      const message = validation.error.issues[0]?.message ?? 'Invalid course content reorder payload';
      throw new AppError(message, ErrorCodes.VALIDATION_ERROR, 400);
    }

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

export type CourseContentDeleteResult = {
  items: Array<{ id: string; type: ContentType }>;
  deletedSubmissions: number;
  deletedLessonCompletions: number;
};

/**
 * Deletes a section's content (and the section) or the given lessons and exercises in one transaction, and returns what
 * was deleted. Without `force`, throws 409 when any of it holds exercise submissions or lesson completions.
 */
export async function deleteCourseContent(
  courseId: string,
  payload: TCourseContentDelete,
  options: { force: boolean } = { force: true }
): Promise<CourseContentDeleteResult> {
  try {
    const sectionId = payload.sectionId;
    if (sectionId) {
      const section = await getCourseSectionById(sectionId);
      if (!section || section.courseId !== courseId) {
        throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
      }
    } else if (!payload.items) {
      throw new AppError('Content items are required', ErrorCodes.VALIDATION_ERROR, 400);
    } else {
      await assertCourseContentItems(courseId, payload.items);
    }

    const itemsToDelete = sectionId
      ? normalizeDeleteItems(
          (await getCourseContentItems(courseId)).filter(
            (item) =>
              (item.type === ContentType.Lesson || item.type === ContentType.Exercise) && item.sectionId === sectionId
          )
        )
      : normalizeDeleteItems(payload.items ?? []);
    const lessonIds = itemsToDelete.filter((item) => item.type === ContentType.Lesson).map((item) => item.id);
    const exerciseIds = itemsToDelete.filter((item) => item.type === ContentType.Exercise).map((item) => item.id);

    const studentWork = await db.transaction(async (tx) => {
      const work = await countContentStudentWork(lessonIds, exerciseIds, tx);
      if (!options.force && work.submissions + work.lessonCompletions > 0) {
        throw new AppError(
          `Students have work here (${work.submissions} submissions, ${work.lessonCompletions} lesson completions). Pass force=true to delete it with their work`,
          ErrorCodes.CONFLICT,
          409
        );
      }

      for (const item of itemsToDelete) {
        if (item.type === ContentType.Lesson) {
          const deleted = await deleteLesson(item.id, tx);
          if (!deleted) {
            throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
          }

          await deleteAssetUsagesByTarget('lesson', item.id, tx);
          continue;
        }

        const deleted = await deleteExercise(item.id, tx);
        if (!deleted) {
          throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
        }
      }

      if (sectionId) {
        const deletedSection = await deleteCourseSection(sectionId, tx);
        if (!deletedSection) {
          throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
        }
      }

      return work;
    });

    return {
      items: itemsToDelete.map((item) => ({ id: item.id, type: item.type as ContentType })),
      deletedSubmissions: studentWork.submissions,
      deletedLessonCompletions: studentWork.lessonCompletions
    };
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
