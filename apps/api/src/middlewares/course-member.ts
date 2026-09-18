import { Context, Next } from 'hono';

import { ErrorCodes, handleError } from '@api/utils/errors';
import { getCourseMemberAccess } from '@cio/db/queries/group';
import { ensureProgramCourseAccess } from '@cio/core/services/course/course';
import { assertCourseNotLockedForStudent } from '@api/services/learning-path';

/**
 * Middleware to check if the authenticated user is a member of a course's group
 * Requires authMiddleware to be applied first
 * Extracts courseId from request params, query, or body
 */
export const courseMemberMiddleware = async (c: Context, next: Next) => {
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

    const courseId = c.req.param('courseId') || c.req.query('courseId');
    if (!courseId) {
      return c.json(
        {
          success: false,
          error: 'Course ID is required',
          code: 'COURSE_ID_REQUIRED'
        },
        400
      );
    }

    const { isMember, isTeamMemberOrAdmin } = await getCourseMemberAccess(courseId, user.id);
    if (isMember) {
      if (!isTeamMemberOrAdmin) {
        await assertCourseNotLockedForStudent(courseId, user.id);
      }
      return next();
    }

    const backfilledFromProgram = await ensureProgramCourseAccess(courseId, user.id);
    if (backfilledFromProgram) {
      await assertCourseNotLockedForStudent(courseId, user.id);
      return next();
    }

    return c.json(
      {
        success: false,
        error: 'You must be a member of this course to perform this action',
        code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
      },
      403
    );
  } catch (error) {
    return handleError(c, error, 'Failed to verify course membership', 'COURSE_MEMBER_CHECK_FAILED');
  }
};
