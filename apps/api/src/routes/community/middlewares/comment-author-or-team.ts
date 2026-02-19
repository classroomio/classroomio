import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { getCommentAuthorAndCourse } from '@cio/db/queries/community';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';

/**
 * Middleware to check if user is comment author OR tutor/admin in course
 * Requires authMiddleware to be applied first
 * Expects comment ID in route params as 'id'
 */
export const commentAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
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

    const commentId = c.req.param('id');
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

    const comment = await getCommentAuthorAndCourse(commentId);
    if (!comment) {
      return c.json(
        {
          success: false,
          error: 'Comment not found',
          code: ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND
        },
        404
      );
    }

    const isAuthor = comment.authorId === user.id;
    if (isAuthor) {
      await next();
      return;
    }

    const isTeamMember = await isCourseTeamMemberOrOrgAdmin(comment.courseId, user.id);

    if (!isTeamMember) {
      return c.json(
        {
          success: false,
          error: 'Only the author or course team members can perform this action',
          code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
        },
        403
      );
    }

    await next();
  } catch (error) {
    console.error('Error in commentAuthorOrTeamMiddleware:', error);
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
