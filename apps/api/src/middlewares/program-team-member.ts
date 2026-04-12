import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { getProgramMemberRole, isOrgAdminByProgramId } from '@cio/db/queries/program';
import { ROLE } from '@cio/utils/constants';

/**
 * Middleware to check if the authenticated user is a program teacher or org admin.
 * Mirrors the course-team-member pattern for program routes.
 */
export const programTeamMemberMiddleware = async (c: Context, next: Next) => {
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

    const programId = c.req.param('programId');
    if (!programId) {
      return c.json(
        {
          success: false,
          error: 'Program ID is required',
          code: 'PROGRAM_ID_REQUIRED'
        },
        400
      );
    }

    const [roleId, isOrgAdmin] = await Promise.all([
      getProgramMemberRole(programId, user.id),
      isOrgAdminByProgramId(programId, user.id)
    ]);

    if (roleId === ROLE.TUTOR || roleId === ROLE.ADMIN || isOrgAdmin) {
      return next();
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
    console.error('Error in programTeamMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify program team membership',
        code: 'PROGRAM_TEAM_MEMBER_CHECK_FAILED'
      },
      500
    );
  }
};
