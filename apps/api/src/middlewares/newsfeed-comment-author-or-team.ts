import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';
import { getNewsfeedCommentAuthorAndCourse } from '@cio/db/queries/newsfeed';
import { isUserCourseTeamMember } from '@cio/db/queries/group';
import { isUserOrgAdmin } from '@cio/db/queries/organization';

/**
 * Middleware to check if user is comment author OR tutor/admin in course
 * Requires authMiddleware to be applied first
 * Expects commentId in route params as 'commentId'
 */
export const newsfeedCommentAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
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

    // Check if user is the author of the comment
    const userGroupMemberId = await getGroupMemberIdByCourseAndProfile(commentInfo.courseId, user.id);
    const isAuthor = commentInfo.authorId === userGroupMemberId;

    if (isAuthor) {
      await next();
      return;
    }

    // Check if user is a team member (ADMIN or TUTOR) in the course
    const { isTeamMember, organizationId } = await isUserCourseTeamMember(commentInfo.courseId, user.id);
    if (isTeamMember) {
      await next();
      return;
    }

    // Check if user is org admin
    if (organizationId) {
      const isOrgAdmin = await isUserOrgAdmin(organizationId, user.id);
      if (isOrgAdmin) {
        await next();
        return;
      }
    }

    return c.json(
      {
        success: false,
        error: 'Only the author or course team members can perform this action',
        code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
      },
      403
    );
  } catch (error) {
    console.error('Error in newsfeedCommentAuthorOrTeamMiddleware:', error);
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
