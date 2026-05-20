import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { getOrgRolesForUser } from '@api/utils/redis/org-roles-cache';

/**
 * Middleware to check if the authenticated user is an admin of the organization.
 * Reads `orgRoles` from the Redis-backed cache (DB fallback on miss).
 *
 * Requires authMiddleware to be applied first.
 * Expects orgId in the 'cio-org-id' header.
 */
export const orgAdminMiddleware = async (c: Context, next: Next) => {
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

    const orgRoles = await getOrgRolesForUser(user.id);
    const roleId = orgRoles[orgId];

    if (roleId !== ROLE.ADMIN) {
      return c.json(
        {
          success: false,
          error: 'Only organization admins can perform this action',
          code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
        },
        403
      );
    }

    await next();
  } catch (error) {
    console.error('Error in orgAdminMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify organization admin status',
        code: 'ORG_ADMIN_CHECK_FAILED'
      },
      500
    );
  }
};
