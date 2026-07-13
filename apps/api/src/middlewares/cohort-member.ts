import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { isOrgAdminByCohortId, isCohortMember } from '@cio/db/queries/cohort';

/**
 * Middleware to check if the authenticated user is a member of the cohort
 * or an org admin for the cohort's organization.
 */
export const cohortMemberMiddleware = async (c: Context, next: Next) => {
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

    const [member, isOrgAdmin] = await Promise.all([
      isCohortMember(cohortId, user.id),
      isOrgAdminByCohortId(cohortId, user.id)
    ]);

    if (member || isOrgAdmin) {
      return next();
    }

    return c.json(
      {
        success: false,
        error: 'You must be a member of this cohort to perform this action',
        code: ErrorCodes.COHORT_FORBIDDEN
      },
      403
    );
  } catch (error) {
    console.error('Error in cohortMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify cohort membership',
        code: ErrorCodes.COHORT_MEMBER_CHECK_FAILED
      },
      500
    );
  }
};
