import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { getCohortMemberRole, isOrgAdminByCohortId } from '@cio/db/queries/cohort';
import { ROLE } from '@cio/utils/constants';

/**
 * Middleware to check if the authenticated user is a cohort teacher or org admin.
 * Mirrors the course-team-member pattern for cohort routes.
 */
export const cohortTeamMemberMiddleware = async (c: Context, next: Next) => {
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

    const cohortId = c.req.param('cohortId');
    if (!cohortId) {
      return c.json(
        {
          success: false,
          error: 'Cohort ID is required',
          code: 'COHORT_ID_REQUIRED'
        },
        400
      );
    }

    const [roleId, isOrgAdmin] = await Promise.all([
      getCohortMemberRole(cohortId, user.id),
      isOrgAdminByCohortId(cohortId, user.id)
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
    console.error('Error in cohortTeamMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify cohort team membership',
        code: 'COHORT_TEAM_MEMBER_CHECK_FAILED'
      },
      500
    );
  }
};
