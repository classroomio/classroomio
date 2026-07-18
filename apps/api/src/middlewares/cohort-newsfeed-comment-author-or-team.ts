import { Context, Next } from 'hono';
import { ErrorCodes } from '@api/utils/errors';
import {
  getCohortMemberByProfileId,
  getCohortMemberRole,
  getCohortNewsfeedById,
  getCohortNewsfeedCommentById,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { ROLE } from '@cio/utils/constants';

export const cohortNewsfeedCommentAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
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

    const comment = await getCohortNewsfeedCommentById(Number(commentId));
    if (!comment?.cohortNewsfeedId) {
      return c.json(
        {
          success: false,
          error: 'Comment not found',
          code: ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND
        },
        404
      );
    }

    const feed = await getCohortNewsfeedById(comment.cohortNewsfeedId);
    if (!feed?.cohortId) {
      return c.json(
        {
          success: false,
          error: 'Cohort newsfeed item not found',
          code: ErrorCodes.COHORT_NEWSFEED_NOT_FOUND
        },
        404
      );
    }

    const member = await getCohortMemberByProfileId(feed.cohortId, user.id);
    const isAuthor = comment.authorId === member?.id;
    if (isAuthor) {
      await next();
      return;
    }

    const isOrgAdmin = await isOrgAdminByCohortId(feed.cohortId, user.id);
    if (isOrgAdmin) {
      await next();
      return;
    }

    const roleId = await getCohortMemberRole(feed.cohortId, user.id);
    const isTeamMember = roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
    if (isTeamMember) {
      await next();
      return;
    }

    return c.json(
      {
        success: false,
        error: 'Only the author or cohort team members can perform this action',
        code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
      },
      403
    );
  } catch (error) {
    console.error('Error in cohortNewsfeedCommentAuthorOrTeamMiddleware:', error);
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
