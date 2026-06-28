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
  getLessonVideoProgress,
  getLessonVideoProgressForLesson,
  getLessonsByCourseId,
  updateLesson,
  updateLessonComment,
  upsertLessonCompletion,
  upsertLessonVideoProgress,
  type LessonById
} from '@cio/db/queries/lesson';
import type { TUpdateLessonWatchProgress } from '@cio/utils/validation/lesson';
import { touchCourseUpdatedAt } from '@cio/db/queries/course';
import { deleteAssetUsagesByTarget } from '@cio/db/queries/assets';
import { db } from '@cio/db/drizzle';
import { enrichLessonWithPresignedUrls } from '../../utils/lesson-media';
import { resolveWatchEnforcedAssetIds } from '../../utils/lesson-watch-enforcement';
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
    const deleted = await db.transaction(async (tx) => {
      const lesson = await deleteLesson(lessonId, tx);
      if (!lesson) {
        return null;
      }

      // asset_usages.target_id has no FK to lesson, so the lesson delete does
      // not cascade here. Prune its usage rows in the same transaction to avoid
      // orphaned attachments that would otherwise block deleting those assets.
      await deleteAssetUsagesByTarget('lesson', lessonId, tx);

      return lesson;
    });

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
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    if (lesson.completionPolicy === 'video_watch' && isComplete) {
      throw new AppError(
        'This lesson completes automatically when the video watch requirement is met',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    const completionData: TNewLessonCompletion = {
      lessonId,
      profileId,
      isComplete
    };

    return await upsertLessonCompletion(completionData);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update lesson completion',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

const WATCH_PROGRESS_WALL_CLOCK_TOLERANCE = 1.5;

export type LessonWatchProgressAssetResult = {
  assetId: string;
  lastPositionSeconds: number;
  watchedSeconds: number;
  furthestSeconds: number;
  durationSeconds: number | null;
  watchedPercent: number;
  isComplete: boolean;
};

export type LessonWatchProgressResult = {
  lastPositionSeconds: number;
  watchedSeconds: number;
  furthestSeconds: number;
  durationSeconds: number | null;
  isComplete: boolean;
  didJustComplete: boolean;
  watchedPercent: number;
  videosComplete: number;
  videosRequired: number;
  assets: LessonWatchProgressAssetResult[];
};

function getWatchedPercent(watchedSeconds: number, durationSeconds: number | null | undefined): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;

  return Math.min(100, Math.round((watchedSeconds / durationSeconds) * 100));
}

function buildAggregateWatchProgress(
  rows: Awaited<ReturnType<typeof getLessonVideoProgressForLesson>>,
  requiredAssetIds: string[]
): LessonWatchProgressResult | null {
  if (requiredAssetIds.length === 0) return null;

  const rowByAssetId = new Map(rows.map((row) => [row.assetId, row]));
  const assets: LessonWatchProgressAssetResult[] = requiredAssetIds.map((assetId) => {
    const row = rowByAssetId.get(assetId);

    const isAssetComplete = row?.isComplete ?? false;

    return {
      assetId,
      lastPositionSeconds: row?.lastPositionSeconds ?? 0,
      watchedSeconds: row?.watchedSeconds ?? 0,
      furthestSeconds: row?.furthestSeconds ?? 0,
      durationSeconds: row?.durationSeconds ?? null,
      watchedPercent: isAssetComplete ? 100 : getWatchedPercent(row?.watchedSeconds ?? 0, row?.durationSeconds),
      isComplete: isAssetComplete
    };
  });

  const videosComplete = assets.filter((asset) => asset.isComplete).length;
  const videosRequired = requiredAssetIds.length;
  const isComplete = videosRequired > 0 && videosComplete === videosRequired;
  const watchedPercent = isComplete
    ? 100
    : assets.length > 0
      ? Math.min(...assets.map((asset) => asset.watchedPercent))
      : 0;
  const primaryAsset = assets[0];

  return {
    lastPositionSeconds: primaryAsset?.lastPositionSeconds ?? 0,
    watchedSeconds: primaryAsset?.watchedSeconds ?? 0,
    furthestSeconds: primaryAsset?.furthestSeconds ?? 0,
    durationSeconds: primaryAsset?.durationSeconds ?? null,
    isComplete,
    didJustComplete: false,
    watchedPercent,
    videosComplete,
    videosRequired,
    assets
  };
}

export async function getLessonWatchProgressService(
  lessonId: string,
  profileId: string
): Promise<LessonWatchProgressResult | null> {
  try {
    const lesson = await getLessonById(lessonId);
    if (!lesson || lesson.completionPolicy !== 'video_watch') return null;

    const requiredAssetIds = resolveWatchEnforcedAssetIds(lesson.videos, lesson.completionPolicy);
    if (requiredAssetIds.length === 0) return null;

    const progressRows = await getLessonVideoProgressForLesson(lessonId, profileId);
    const filteredRows = progressRows.filter((row) => requiredAssetIds.includes(row.assetId));

    return buildAggregateWatchProgress(filteredRows, requiredAssetIds);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get lesson watch progress',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateLessonWatchProgressService(
  lessonId: string,
  profileId: string,
  beat: TUpdateLessonWatchProgress
): Promise<LessonWatchProgressResult> {
  try {
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    if (lesson.completionPolicy !== 'video_watch') {
      throw new AppError('This lesson does not require video watch tracking', ErrorCodes.VALIDATION_ERROR, 400);
    }

    if (!beat.assetId) {
      throw new AppError('Video asset is required for watch progress', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const requiredAssetIds = resolveWatchEnforcedAssetIds(lesson.videos, lesson.completionPolicy);
    if (!requiredAssetIds.includes(beat.assetId)) {
      throw new AppError('This video is not configured for watch enforcement', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const existing = await getLessonVideoProgress(lessonId, profileId, beat.assetId);
    const threshold = lesson.videoWatchThreshold ?? 95;
    const now = Date.now();

    if (existing?.isComplete) {
      const aggregate = buildAggregateWatchProgress(
        await getLessonVideoProgressForLesson(lessonId, profileId),
        requiredAssetIds
      );

      return {
        ...(aggregate ?? {
          lastPositionSeconds: existing.lastPositionSeconds ?? beat.positionSeconds,
          watchedSeconds: existing.watchedSeconds ?? 0,
          furthestSeconds: existing.furthestSeconds ?? 0,
          durationSeconds: existing.durationSeconds ?? beat.durationSeconds,
          isComplete: true,
          didJustComplete: false,
          watchedPercent: 100,
          videosComplete: requiredAssetIds.length,
          videosRequired: requiredAssetIds.length,
          assets: []
        }),
        didJustComplete: false
      };
    }

    const positionSeconds = Math.floor(beat.positionSeconds);

    if (existing?.updatedAt) {
      const elapsedSeconds = (now - new Date(existing.updatedAt).getTime()) / 1000;
      const maxAllowedDelta = Math.max(5, elapsedSeconds * WATCH_PROGRESS_WALL_CLOCK_TOLERANCE);

      if (beat.playedDeltaSeconds > maxAllowedDelta) {
        throw new AppError('Invalid watch progress update', ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    const previousFurthest = existing?.furthestSeconds ?? 0;
    const playedDeltaSeconds = Math.max(0, Math.round(beat.playedDeltaSeconds));
    const reachedEnd = positionSeconds >= beat.durationSeconds - 1;
    let watchedSeconds = Math.min(beat.durationSeconds, (existing?.watchedSeconds ?? 0) + playedDeltaSeconds);

    if (reachedEnd) {
      watchedSeconds = beat.durationSeconds;
    }

    const furthestSeconds = Math.max(previousFurthest, positionSeconds, reachedEnd ? beat.durationSeconds : 0);
    const watchPercent = (watchedSeconds / beat.durationSeconds) * 100;
    const assetComplete = watchPercent >= threshold;

    const rowsBeforeUpdate = await getLessonVideoProgressForLesson(lessonId, profileId);
    const priorAggregate = buildAggregateWatchProgress(rowsBeforeUpdate, requiredAssetIds);
    const wasLessonComplete = priorAggregate?.isComplete ?? false;

    await upsertLessonVideoProgress({
      lessonId,
      profileId,
      assetId: beat.assetId,
      durationSeconds: beat.durationSeconds,
      watchedSeconds,
      furthestSeconds,
      lastPositionSeconds: reachedEnd ? beat.durationSeconds : positionSeconds,
      isComplete: assetComplete,
      completedAt: assetComplete ? new Date().toISOString() : null
    });

    const allRows = await getLessonVideoProgressForLesson(lessonId, profileId);
    const aggregate = buildAggregateWatchProgress(allRows, requiredAssetIds);
    const didJustComplete = (aggregate?.isComplete ?? false) && !wasLessonComplete;

    if (didJustComplete) {
      await upsertLessonCompletion({
        lessonId,
        profileId,
        isComplete: true
      });
    }

    if (!aggregate) {
      throw new AppError('Failed to aggregate lesson watch progress', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return {
      ...aggregate,
      didJustComplete
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update lesson watch progress',
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
