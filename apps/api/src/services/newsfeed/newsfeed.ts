import { AppError, ErrorCodes } from '@api/utils/errors';
import { sanitizeHtml } from '@cio/core/utils/sanitize-html';
import { TENANT_ROOT_DOMAIN } from '@cio/utils/constants/domains';
import type { TCourseNewsfeed, TNewCourseNewsfeed, TNewCourseNewsfeedComment } from '@cio/db/types';
import type { TNewsfeedCreate, TNewsfeedUpdate } from '@cio/utils/validation/newsfeed';
import {
  countNewsfeedCommentDescendants,
  createNewsfeed,
  createNewsfeedComment,
  deleteNewsfeed,
  deleteNewsfeedComment,
  getNewsfeedByCourseId,
  getNewsfeedByCourseIdPaginated,
  getNewsfeedById,
  getNewsfeedCommentById,
  getNewsfeedCommentDepth,
  getNewsfeedCommentThread,
  getNewsfeedCommentsByFeedId,
  getNewsfeedForEmail,
  updateNewsfeed,
  updateNewsfeedComment
} from '@cio/db/queries/newsfeed';

import { env } from '@cio/core/config/env';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';

/**
 * Bounds pathological chains. Far beyond any real conversation — nesting is not
 * otherwise limited, and the UI stops indenting long before this.
 */
const MAX_COMMENT_DEPTH = 50;

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
    const sanitizedContent = sanitizeHtml(data.content);

    const newsfeedData: TNewCourseNewsfeed = {
      courseId,
      authorId,
      content: sanitizedContent,
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
    const updated = await updateNewsfeed(feedId, {
      ...data,
      content: data.content === undefined ? undefined : sanitizeHtml(data.content)
    });
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
 * Gets a comment subtree for a newsfeed item
 * @param feedId Newsfeed ID
 * @param options rootId, cursor, childCursor, rootLimit, childLimit, maxDepth
 * @returns The subtree with pagination metadata
 */
export async function getNewsfeedCommentThreadService(
  feedId: string,
  options: {
    rootId?: number;
    cursor?: string;
    childCursor?: string;
    rootLimit: number;
    childLimit: number;
    maxDepth: number;
  }
) {
  try {
    const feed = await getNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Newsfeed item not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    if (options.rootId !== undefined) {
      const root = await getNewsfeedCommentById(options.rootId);
      if (!root) {
        throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
      }

      if (root.courseNewsfeedId !== feedId) {
        throw new AppError('Comment does not belong to this feed', ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    return await getNewsfeedCommentThread(feedId, options);
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
 * @param parentId Optional parent comment ID — the comment being replied to, at any depth
 * @returns Created comment
 */
export async function createNewsfeedCommentService(
  feedId: string,
  authorId: string,
  content: string,
  parentId?: number
) {
  try {
    // Validate parentId when provided
    if (parentId !== undefined) {
      const parentComment = await getNewsfeedCommentById(parentId);

      if (!parentComment) {
        throw new AppError('Parent comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
      }

      if (parentComment.courseNewsfeedId !== feedId) {
        throw new AppError('Parent comment does not belong to this feed', ErrorCodes.VALIDATION_ERROR, 400);
      }

      // A new comment has no children, and updates only touch content, so an insert can
      // never create a cycle. This cap only bounds pathological chains.
      const parentDepth = await getNewsfeedCommentDepth(parentId);
      if (parentDepth + 1 > MAX_COMMENT_DEPTH) {
        throw new AppError('Reply is nested too deeply', ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    const sanitizedContent = sanitizeHtml(content);

    const commentData: TNewCourseNewsfeedComment = {
      courseNewsfeedId: feedId,
      authorId,
      content: sanitizedContent,
      parentId: parentId ?? null,
      replyToCommentId: null
    };

    const comment = await createNewsfeedComment(commentData);

    // Send email notification to feed author (async, don't wait)
    sendNewsfeedCommentEmail(feedId, sanitizedContent, authorId).catch((error) => {
      console.error('Failed to send newsfeed comment email:', error);
    });

    return comment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

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
    const updated = await updateNewsfeedComment(commentId, sanitizeHtml(content));
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
    // Must precede the delete — the cascade removes descendants before we could count them.
    const deletedDescendantCount = await countNewsfeedCommentDescendants(commentId);

    const deleted = await deleteNewsfeedComment(commentId);
    if (!deleted) {
      throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
    }

    return { ...deleted, deletedDescendantCount };
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
    const branding = buildEmailBranding({
      name: feedData.organization?.name,
      avatarUrl: feedData.organization?.avatarUrl,
      theme: feedData.organization?.theme
    });
    const postLink = `https://${orgSiteName}.${TENANT_ROOT_DOMAIN}/courses/${feedData.courseId}?feedId=${feedData.feedId}`;

    const recipients = feedData.courseMembers
      .map((member) => member.email)
      .filter((email): email is string => Boolean(email));

    if (recipients.length === 0) return;

    await enqueueTransactionalEmail('newsfeedPost', {
      to: recipients,
      fields: {
        courseTitle: feedData.courseTitle!,
        teacherName: feedData.author?.fullname || 'A teacher',
        content: feedData.content || '',
        postLink,
        orgName,
        branding
      },
      from: buildEmailFromName(`${orgName} - ClassroomIO`),
      replyTo: feedData.author?.email || 'noreply@classroomio.com',
      idempotencyKey: `newsfeed:post:${feedId}`,
      preference: { organizationId: feedData.organization.id }
    });
  } catch (error) {
    console.error('Error sending newsfeed post email:', error);
    // Don't throw - email failures shouldn't break the API
  }
}

/**
 * Sends email notification when a comment is added to a feed
 * Sends to the feed author (teacher), unless they are the one commenting
 */
async function sendNewsfeedCommentEmail(feedId: string, commentContent: string, commenterGroupMemberId: string) {
  try {
    const feedData = await getNewsfeedForEmail(feedId);
    if (!feedData || !feedData.courseId || !feedData.courseTitle || !feedData.organization?.siteName) {
      return;
    }

    if (!feedData.author?.email) {
      return;
    }

    if (feedData.author.groupMemberId === commenterGroupMemberId) {
      return;
    }

    const orgName = feedData.organization?.name || 'ClassroomIO';
    const orgSiteName = feedData.organization?.siteName || 'app';
    const branding = buildEmailBranding({
      name: feedData.organization?.name,
      avatarUrl: feedData.organization?.avatarUrl,
      theme: feedData.organization?.theme
    });
    const postLink = `https://${orgSiteName}.${TENANT_ROOT_DOMAIN}/courses/${feedData.courseId}?feedId=${feedData.feedId}`;

    await enqueueTransactionalEmail('newsfeedComment', {
      to: feedData.author.email,
      fields: {
        courseTitle: feedData.courseTitle,
        comment: commentContent,
        postLink,
        orgName,
        branding
      },
      from: buildEmailFromName(`${orgName} - ClassroomIO`),
      replyTo: 'noreply@classroomio.com',
      preference: { organizationId: feedData.organization.id }
    });
  } catch (error) {
    console.error('Error sending newsfeed comment email:', error);
    // Don't throw - email failures shouldn't break the API
  }
}
