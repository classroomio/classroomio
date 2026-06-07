import { AppError, ErrorCodes } from '@cio/utils/errors';
import { sanitizeHtml } from '../../utils/sanitize-html';
import type { TLesson, TNewLessonComment, TNewLessonCompletion } from '@cio/db/types';
import type { TLessonCreate, TLessonReorder, TLessonUpdate } from '@cio/utils/validation/lesson';
import {
  createLessonComment,
  createLessons,
  deleteLesson,
  deleteLessonComment,
  getLessonById,
  getLessonCommentsByLessonId,
  getLessonCommentsByLessonIdPaginated,
  getLessonCompletion,
  getLessonVersionHistory,
  getLessonsByCourseId,
  updateLesson,
  updateLessonComment,
  upsertLessonCompletion,
  type LessonById
} from '@cio/db/queries/lesson';
import { touchCourseUpdatedAt } from '@cio/db/queries/course';
import { enrichLessonWithPresignedUrls } from '../../utils/lesson-media';
import { resolveItemSlug } from '../course/slug';

/**
 * Creates a new lesson
 * @param courseId Course ID
 * @param data Lesson creation data
 * @returns Created lesson
 */
export async function createLesson(courseId: string, data: TLessonCreate): Promise<TLesson> {
  try {
    const slug = await resolveItemSlug({
      courseId,
      title: data.title,
      requestedSlug: data.slug
    });

    const lessonData = {
      ...data,
      courseId,
      slug
    };

    const [lesson] = await createLessons([lessonData]);
    if (!lesson) {
      throw new AppError('Failed to create lesson', ErrorCodes.INTERNAL_ERROR, 500);
    }

    await touchCourseUpdatedAt(courseId);

    return lesson;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create lesson',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets a lesson by ID
 * @param lessonId Lesson ID
 * @returns Lesson or throws error if not found
 */
export async function getLesson(lessonId: string): Promise<LessonById> {
  try {
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    return enrichLessonWithPresignedUrls(lesson);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Log error with context for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lesson';
    console.error(`Error fetching lesson ${lessonId}:`, errorMessage, error);

    throw new AppError(errorMessage, ErrorCodes.LESSON_FETCH_FAILED, 500);
  }
}

/**
 * Updates a lesson
 * @param lessonId Lesson ID
 * @param data Partial lesson update data
 * @returns Updated lesson
 */
export async function updateLessonService(lessonId: string, data: TLessonUpdate): Promise<TLesson> {
  try {
    const payload: TLessonUpdate = { ...data };

    if (payload.slug !== undefined) {
      const existing = await getLessonById(lessonId);
      if (!existing) {
        throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
      }
      if (!existing.courseId) {
        throw new AppError('Lesson has no course', ErrorCodes.LESSON_NOT_FOUND, 404);
      }

      payload.slug = await resolveItemSlug({
        courseId: existing.courseId,
        title: payload.title ?? existing.title,
        requestedSlug: payload.slug,
        ignoreItemSlug: existing.slug ?? undefined
      });
    }

    const updated = await updateLesson(lessonId, payload);
    if (!updated) {
      throw new AppError('Failed to update lesson', ErrorCodes.INTERNAL_ERROR, 500);
    }

    if (updated.courseId) {
      await touchCourseUpdatedAt(updated.courseId);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update lesson',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes a lesson
 * @param lessonId Lesson ID
 * @returns Deleted lesson
 */
export async function deleteLessonService(lessonId: string): Promise<TLesson> {
  try {
    const deleted = await deleteLesson(lessonId);
    if (!deleted) {
      throw new AppError('Failed to delete lesson', ErrorCodes.INTERNAL_ERROR, 500);
    }

    if (deleted.courseId) {
      await touchCourseUpdatedAt(deleted.courseId);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete lesson',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Lists lessons for a course
 * @param courseId Course ID
 * @param sectionId Optional section ID filter
 * @returns Array of lessons
 */
export async function listLessons(courseId: string, sectionId?: string): Promise<TLesson[]> {
  try {
    const lessons = await getLessonsByCourseId(courseId);

    if (sectionId) {
      return lessons.filter((lesson) => lesson.sectionId === sectionId);
    }

    return lessons;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list lessons',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Reorders lessons
 * @param lessons Array of lesson IDs, orders, and optional sectionIds
 * @returns Updated lessons
 */
export async function reorderLessons(lessons: TLessonReorder['lessons']): Promise<TLesson[]> {
  try {
    // Update each lesson's order and optionally sectionId
    const updatePromises = lessons.map(({ id, order, sectionId }) =>
      updateLesson(id, { order, ...(sectionId !== undefined && { sectionId }) })
    );

    const updated = await Promise.all(updatePromises);
    const validLessons = updated.filter((l): l is TLesson => l !== null);

    const courseId = validLessons[0]?.courseId;
    if (courseId) {
      await touchCourseUpdatedAt(courseId);
    }

    return validLessons;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reorder lessons',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// Lesson Comment Services

/**
 * Gets comments for a lesson
 * @param lessonId Lesson ID
 * @returns Array of comments
 */
export async function getLessonComments(lessonId: string) {
  try {
    return getLessonCommentsByLessonId(lessonId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get lesson comments',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets paginated comments for a lesson
 * @param lessonId Lesson ID
 * @param options Pagination options (cursor, limit)
 * @returns Paginated comments with metadata
 */
export async function getLessonCommentsPaginated(lessonId: string, options: { cursor?: string; limit: number }) {
  try {
    return getLessonCommentsByLessonIdPaginated(lessonId, options);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get paginated lesson comments',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates a lesson comment
 * @param lessonId Lesson ID
 * @param groupMemberId Group member ID (author)
 * @param comment Comment text
 * @returns Created comment
 */
export async function createLessonCommentService(lessonId: string, groupMemberId: string, comment: string) {
  try {
    const commentData: TNewLessonComment = {
      lessonId,
      groupmemberId: groupMemberId,
      comment: sanitizeHtml(comment)
    };

    return await createLessonComment(commentData);
  } catch (error) {
    console.log('error', error);
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create lesson comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a lesson comment
 * @param commentId Comment ID
 * @param comment Updated comment text
 * @returns Updated comment
 */
export async function updateLessonCommentService(commentId: number, comment: string) {
  try {
    const updated = await updateLessonComment(commentId, sanitizeHtml(comment));
    if (!updated) {
      throw new AppError('Comment not found', ErrorCodes.LESSON_COMMENT_UPDATE_FAILED, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update lesson comment',
      ErrorCodes.LESSON_COMMENT_UPDATE_FAILED,
      500
    );
  }
}

/**
 * Deletes a lesson comment
 * @param commentId Comment ID
 * @returns Deleted comment
 */
export async function deleteLessonCommentService(commentId: number) {
  try {
    const deleted = await deleteLessonComment(commentId);
    if (!deleted) {
      throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete lesson comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// Lesson Completion Services

/**
 * Gets lesson completion status
 * @param lessonId Lesson ID
 * @param profileId Profile ID
 * @returns Completion record or null
 */
export async function getLessonCompletionService(lessonId: string, profileId: string) {
  try {
    return await getLessonCompletion(lessonId, profileId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get lesson completion',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates or updates lesson completion
 * @param lessonId Lesson ID
 * @param profileId Profile ID
 * @param isComplete Completion status
 * @returns Completion record
 */
export async function upsertLessonCompletionService(lessonId: string, profileId: string, isComplete: boolean) {
  try {
    const completionData: TNewLessonCompletion = {
      lessonId,
      profileId,
      isComplete
    };

    return await upsertLessonCompletion(completionData);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update lesson completion',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets lesson version history for a lesson and locale
 * @param lessonId Lesson ID
 * @param locale Locale
 * @param endRange End range for pagination (0-indexed, inclusive)
 * @returns Array of lesson version history entries
 */
export async function getLessonHistoryService(lessonId: string, locale: string, endRange: number) {
  try {
    return getLessonVersionHistory(lessonId, locale, endRange);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get lesson history',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
