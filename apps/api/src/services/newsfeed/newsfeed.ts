import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TCourseNewsfeed, TNewCourseNewsfeed, TNewCourseNewsfeedComment } from '@cio/db/types';
import type { TNewsfeedCreate, TNewsfeedUpdate } from '@cio/utils/validation/newsfeed';
import {
  createNewsfeed,
  createNewsfeedComment,
  deleteNewsfeed,
  deleteNewsfeedComment,
  getNewsfeedByCourseId,
  getNewsfeedByCourseIdPaginated,
  getNewsfeedById,
  getNewsfeedCommentsByFeedId,
  getNewsfeedCommentsByFeedIdPaginated,
  getNewsfeedForEmail,
  updateNewsfeed,
  updateNewsfeedComment
} from '@cio/db/queries/newsfeed';

import { env } from '@api/config/env';
import { buildEmailFromName, sendEmail } from '@cio/email';

/**
 * Lists newsfeed items for a course
 * @param courseId Course ID
 * @returns Array of newsfeed items
 */
export async function listNewsfeed(courseId: string): Promise<TCourseNewsfeed[]> {
  try {
    return await getNewsfeedByCourseId(courseId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Lists paginated newsfeed items for a course
 * @param courseId Course ID
 * @param options Pagination options (cursor, limit)
 * @returns Paginated newsfeed items with metadata and author profile
 */
export async function listNewsfeedPaginated(courseId: string, options: { cursor?: string; limit: number }) {
  try {
    return getNewsfeedByCourseIdPaginated(courseId, options);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list paginated newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets a newsfeed item by ID
 * @param feedId Newsfeed ID
 * @returns Newsfeed item
 */
export async function getNewsfeedItem(feedId: string): Promise<TCourseNewsfeed> {
  try {
    const feed = await getNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Newsfeed item not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    return feed;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch newsfeed item',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates a new newsfeed item
 * @param courseId Course ID
 * @param authorId Group member ID (author)
 * @param data Newsfeed creation data
 * @returns Created newsfeed item
 */
export async function createNewsfeedService(
  courseId: string,
  authorId: string,
  data: TNewsfeedCreate
): Promise<TCourseNewsfeed> {
  try {
    const newsfeedData: TNewCourseNewsfeed = {
      courseId,
      authorId,
      content: data.content,
      isPinned: data.isPinned || false
    };

    const feed = await createNewsfeed(newsfeedData);

    // Send email notifications to course members (async, don't wait)
    sendNewsfeedPostEmail(feed.id, authorId).catch((error) => {
      console.error('Failed to send newsfeed post email:', error);
    });

    return feed;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a newsfeed item (content and isPinned only)
 * @param feedId Newsfeed ID
 * @param data Partial newsfeed update data
 * @returns Updated newsfeed item
 */
export async function updateNewsfeedService(feedId: string, data: TNewsfeedUpdate): Promise<TCourseNewsfeed> {
  try {
    const updated = await updateNewsfeed(feedId, data);
    if (!updated) {
      // If no row was updated, it usually means the feed doesn't exist.
      throw new AppError('Newsfeed item not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a newsfeed item's reaction
 * @param feedId Newsfeed ID
 * @param reaction Reaction data
 * @returns Updated newsfeed item
 */
export async function updateNewsfeedReactionService(
  feedId: string,
  reaction: TCourseNewsfeed['reaction']
): Promise<TCourseNewsfeed> {
  try {
    const updated = await updateNewsfeed(feedId, { reaction });
    if (!updated) {
      // If no row was updated, it usually means the feed doesn't exist.
      throw new AppError('Newsfeed item not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update newsfeed reaction',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes a newsfeed item
 * @param feedId Newsfeed ID
 * @returns Deleted newsfeed item
 */
export async function deleteNewsfeedService(feedId: string): Promise<TCourseNewsfeed> {
  try {
    const deleted = await deleteNewsfeed(feedId);
    if (!deleted) {
      // If no row was deleted, it usually means the feed doesn't exist.
      throw new AppError('Newsfeed item not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets comments for a newsfeed item
 * @param feedId Newsfeed ID
 * @returns Array of comments
 */
export async function getNewsfeedComments(feedId: string) {
  try {
    return await getNewsfeedCommentsByFeedId(feedId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get newsfeed comments',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets paginated comments for a newsfeed item
 * @param feedId Newsfeed ID
 * @param options Pagination options (cursor, limit)
 * @returns Paginated comments with metadata
 */
export async function getNewsfeedCommentsService(feedId: string, options: { cursor?: string; limit: number }) {
  try {
    const feed = await getNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Newsfeed item not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    return await getNewsfeedCommentsByFeedIdPaginated(feedId, options);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get paginated newsfeed comments',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates a newsfeed comment
 * @param feedId Newsfeed ID
 * @param authorId Group member ID (author)
 * @param content Comment content
 * @returns Created comment
 */
export async function createNewsfeedCommentService(feedId: string, authorId: string, content: string) {
  try {
    const commentData: TNewCourseNewsfeedComment = {
      courseNewsfeedId: feedId,
      authorId,
      content
    };

    const comment = await createNewsfeedComment(commentData);

    // Send email notification to feed author (async, don't wait)
    sendNewsfeedCommentEmail(feedId, content).catch((error) => {
      console.error('Failed to send newsfeed comment email:', error);
    });

    return comment;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create newsfeed comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a newsfeed comment
 * @param commentId Comment ID
 * @param content Updated comment content
 * @returns Updated comment
 */
export async function updateNewsfeedCommentService(commentId: number, content: string) {
  try {
    const updated = await updateNewsfeedComment(commentId, content);
    if (!updated) {
      throw new AppError('Comment not found', ErrorCodes.NEWSFEED_COMMENT_UPDATE_FAILED, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update newsfeed comment',
      ErrorCodes.NEWSFEED_COMMENT_UPDATE_FAILED,
      500
    );
  }
}

/**
 * Deletes a newsfeed comment
 * @param commentId Comment ID
 * @returns Deleted comment
 */
export async function deleteNewsfeedCommentService(commentId: number) {
  try {
    const deleted = await deleteNewsfeedComment(commentId);
    if (!deleted) {
      throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete newsfeed comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Sends email notification when a new feed is created
 * Sends to all course members except the author
 */
async function sendNewsfeedPostEmail(feedId: string, authorId: string) {
  try {
    const feedData = await getNewsfeedForEmail(feedId, authorId);
    if (!feedData || !feedData.courseId || !feedData.courseTitle || !feedData.organization?.siteName) {
      return;
    }

    if (feedData.courseMembers.length === 0) {
      return;
    }

    const orgName = feedData.organization?.name || 'ClassroomIO';
    const orgSiteName = feedData.organization?.siteName || 'app';
    const postLink = `https://${orgSiteName}.classroomio.com/courses/${feedData.courseId}?feedId=${feedData.feedId}`;

    // Send email to all course members
    const emailPromises = feedData.courseMembers.map((member) => {
      if (!member.email) return Promise.resolve();

      return sendEmail('newsfeedPost', {
        to: member.email,
        fields: {
          courseTitle: feedData.courseTitle!,
          teacherName: feedData.author?.fullname || 'A teacher',
          content: feedData.content || '',
          postLink,
          orgName
        },
        from: buildEmailFromName(`${orgName} - ClassroomIO`),
        replyTo: feedData.author?.email || 'noreply@classroomio.com'
      });
    });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error sending newsfeed post email:', error);
    // Don't throw - email failures shouldn't break the API
  }
}

/**
 * Sends email notification when a comment is added to a feed
 * Sends to the feed author (teacher)
 */
async function sendNewsfeedCommentEmail(feedId: string, commentContent: string) {
  try {
    const feedData = await getNewsfeedForEmail(feedId);
    if (!feedData || !feedData.courseId || !feedData.courseTitle || !feedData.organization?.siteName) {
      return;
    }

    if (!feedData.author?.email) {
      return;
    }

    const orgName = feedData.organization?.name || 'ClassroomIO';
    const orgSiteName = feedData.organization?.siteName || 'app';
    const postLink = `https://${orgSiteName}.classroomio.com/courses/${feedData.courseId}?feedId=${feedData.feedId}`;

    await sendEmail('newsfeedComment', {
      to: feedData.author.email,
      fields: {
        courseTitle: feedData.courseTitle,
        comment: commentContent,
        postLink,
        orgName
      },
      from: buildEmailFromName(`${orgName} - ClassroomIO`),
      replyTo: 'noreply@classroomio.com'
    });
  } catch (error) {
    console.error('Error sending newsfeed comment email:', error);
    // Don't throw - email failures shouldn't break the API
  }
}
