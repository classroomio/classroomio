import { Context, Next } from 'hono';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';

import { ErrorCodes } from '@api/utils/errors';
import { getNewsfeedCommentAuthorAndCourse } from '@cio/db/queries/newsfeed';

/**
 * Middleware to check if user is strictly the comment author
 * Requires authMiddleware to be applied first
 * Expects commentId in route params as 'commentId'
 */
export const newsfeedCommentAuthorOnlyMiddleware = async (c: Context, next: Next) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        401
      );
    }

    const commentId = c.req.param('commentId');
    if (!commentId) {
      return c.json(
        {
          success: false,
          error: 'Comment ID is required',
          code: 'COMMENT_ID_REQUIRED'
        },
        400
      );
    }

    const commentInfo = await getNewsfeedCommentAuthorAndCourse(Number(commentId));
    if (!commentInfo || !commentInfo.courseId) {
      return c.json(
        {
          success: false,
          error: 'Comment not found',
          code: ErrorCodes.COMMENT_NOT_FOUND
        },
        404
      );
    }

    const userGroupMemberId = await getGroupMemberIdByCourseAndProfile(commentInfo.courseId, user.id);
    const isAuthor = Boolean(userGroupMemberId && commentInfo.authorId && commentInfo.authorId === userGroupMemberId);

    if (!isAuthor) {
      return c.json(
        {
          success: false,
          error: 'Only the author of this comment can edit it',
          code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
        },
        403
      );
    }

    await next();
  } catch (error) {
    console.error('Error in newsfeedCommentAuthorOnlyMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify comment authorization',
        code: 'COMMENT_AUTH_CHECK_FAILED'
      },
      500
    );
  }
};
