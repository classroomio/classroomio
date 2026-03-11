import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { isUserOrgTeamMember } from '@cio/db/queries/organization';

/**
 * Middleware to check if the authenticated user is a team member (ADMIN or TUTOR) of the organization
 * Requires authMiddleware to be applied first
 * Expects orgId in the 'cio-org-id' header
 */
export const orgTeamMemberMiddleware = async (c: Context, next: Next) => {
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

    const orgId = c.req.header('cio-org-id');

    if (!orgId) {
      return c.json(
        {
          success: false,
          error: 'Organization ID is required',
          code: 'ORG_ID_REQUIRED'
        },
        400
      );
    }

    const isTeamMember = await isUserOrgTeamMember(orgId, user.id);
    if (!isTeamMember) {
      return c.json(
        {
          success: false,
          error: 'Only organization team members (admins or tutors) can perform this action',
          code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
        },
        403
      );
    }

    await next();
  } catch (error) {
    console.error('Error in orgTeamMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify organization team member status',
        code: 'ORG_TEAM_MEMBER_CHECK_FAILED'
      },
      500
    );
  }
};
