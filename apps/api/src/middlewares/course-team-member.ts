import { Context, Next } from 'hono';
import { isUserCourseMember, isUserCourseTeamMember } from '@cio/db/queries/group';

import { ErrorCodes } from '@api/utils/errors';
import { isUserOrgAdmin } from '@cio/db/queries/organization';

/**
 * Middleware to check if the authenticated user is a team member (ADMIN or TUTOR) of a course
 * Also allows organization admins
 * Requires authMiddleware to be applied first
 * Extracts courseId from request params
 */
export const courseTeamMemberMiddleware = async (c: Context, next: Next) => {
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

    const courseId = c.req.param('courseId');
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

    // Check if user is a team member (ADMIN or TUTOR) in the course
    const { isTeamMember, organizationId } = await isUserCourseTeamMember(courseId, user.id);
    if (isTeamMember) {
      return next();
    }

    if (organizationId) {
      const isOrgAdmin = await isUserOrgAdmin(organizationId, user.id);
      if (isOrgAdmin) {
        return next();
      }
    }

    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        code: ErrorCodes.UNAUTHORIZED
      },
      403
    );
  } catch (error) {
    console.error('Error in courseTeamMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        code: ErrorCodes.UNAUTHORIZED
      },
      500
    );
  }
};
