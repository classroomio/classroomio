import { Context, Next } from 'hono';
import { ErrorCodes } from '@api/utils/errors';
import {
  getProgramMemberByProfileId,
  getProgramMemberRole,
  getProgramNewsfeedById,
  getProgramNewsfeedCommentById,
  isOrgAdminByProgramId
} from '@cio/db/queries/program';
import { ROLE } from '@cio/utils/constants';

export const programNewsfeedCommentAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
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

    const comment = await getProgramNewsfeedCommentById(Number(commentId));
    if (!comment?.programNewsfeedId) {
      return c.json(
        {
          success: false,
          error: 'Comment not found',
          code: ErrorCodes.PROGRAM_NEWSFEED_COMMENT_NOT_FOUND
        },
        404
      );
    }

    const feed = await getProgramNewsfeedById(comment.programNewsfeedId);
    if (!feed?.programId) {
      return c.json(
        {
          success: false,
          error: 'Program newsfeed item not found',
          code: ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND
        },
        404
      );
    }

    const member = await getProgramMemberByProfileId(feed.programId, user.id);
    const isAuthor = comment.authorId === member?.id;
    if (isAuthor) {
      await next();
      return;
    }

    const isOrgAdmin = await isOrgAdminByProgramId(feed.programId, user.id);
    if (isOrgAdmin) {
      await next();
      return;
    }

    const roleId = await getProgramMemberRole(feed.programId, user.id);
    const isTeamMember = roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
    if (isTeamMember) {
      await next();
      return;
    }

    return c.json(
      {
        success: false,
        error: 'Only the author or program team members can perform this action',
        code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
      },
      403
    );
  } catch (error) {
    console.error('Error in programNewsfeedCommentAuthorOrTeamMiddleware:', error);
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
