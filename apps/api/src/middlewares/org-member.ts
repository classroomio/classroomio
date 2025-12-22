import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { isUserOrgMember } from '@cio/db/queries/organization';

/**
 * Middleware to check if the authenticated user is a member of the organization
 * Requires authMiddleware to be applied first
 * Expects orgId in the 'cio-org-id' header
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

    const isMember = await isUserOrgMember(orgId, user.id);
    if (!isMember) {
      return c.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          code: 'UNAUTHORIZED'
        },
        403
      );
    }

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
