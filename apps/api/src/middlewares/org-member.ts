import { Context, Next } from 'hono';
import { getOrgRolesForUser } from '@api/utils/redis/org-roles-cache';

/**
 * Middleware to check if the authenticated user is a member of the organization.
 * Loads `orgRoles` from the Redis-backed cache (DB fallback on miss) so the
 * lookup stays out of the Better Auth session cookie — keeping that cookie
 * small enough for the oauth-proxy redirect to fit in a Location header.
 *
 * Requires authMiddleware to be applied first.
 * Expects orgId in the 'cio-org-id' header.
 * Stores orgRole and orgId in context for use in route handlers.
 */
export const orgMemberMiddleware = async (c: Context, next: Next) => {
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

    if (roleId === undefined) {
      return c.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          code: 'UNAUTHORIZED'
        },
        403
      );
    }

    c.set('userRole', roleId);
    c.set('orgId', orgId);

    await next();
  } catch (error) {
    console.error('Error in orgMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        code: 'INTERNAL_ERROR'
      },
      500
    );
  }
};
