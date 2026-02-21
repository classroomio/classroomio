import { Context, Next } from 'hono';

import { getUserOrgRole } from '@cio/db/queries/organization';

/**
 * Middleware to check if the authenticated user is a member of the organization
 * Requires authMiddleware to be applied first
 * Expects orgId in the 'cio-org-id' header
 * Stores orgRole and orgId in context for use in route handlers
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

    const roleId = await getUserOrgRole(orgId, user.id);
    if (roleId === null) {
      return c.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          code: 'UNAUTHORIZED'
        },
        403
      );
    }

    // Store orgRole and orgId in context for use in route handlers
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
