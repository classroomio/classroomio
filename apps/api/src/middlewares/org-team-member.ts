import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';

/**
 * Middleware to check if the authenticated user is a team member (ADMIN or TUTOR) of the organization.
 * Reads the role from the Better Auth session (populated by the customSession plugin),
 * so no per-request DB query is performed.
 *
 * Requires authMiddleware to be applied first.
 * Expects orgId in the 'cio-org-id' header.
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

    const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
    const roleId = orgRoles[orgId];

    if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
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
