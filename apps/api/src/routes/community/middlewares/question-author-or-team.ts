import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { getQuestionAuthorAndCourse } from '@cio/db/queries/community';
import { isUserCourseTeamMember } from '@cio/db/queries/group';

/**
 * Middleware to check if user is question author OR tutor/admin in course
 * Requires authMiddleware to be applied first
 * Expects question ID in route params as 'id'
 */
export const questionAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
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

    const questionId = c.req.param('id');
    if (!questionId) {
      return c.json(
        {
          success: false,
          error: 'Question ID is required',
          code: 'QUESTION_ID_REQUIRED'
        },
        400
      );
    }

    const question = await getQuestionAuthorAndCourse(questionId);
    if (!question) {
      return c.json(
        {
          success: false,
          error: 'Question not found',
          code: ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND
        },
        404
      );
    }

    const isAuthor = question.authorId === user.id;
    const isTeamMember = await isUserCourseTeamMember(question.courseId, user.id);

    if (!isAuthor && !isTeamMember) {
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
    console.error('Error in questionAuthorOrTeamMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify question authorization',
        code: 'QUESTION_AUTH_CHECK_FAILED'
      },
      500
    );
  }
};
