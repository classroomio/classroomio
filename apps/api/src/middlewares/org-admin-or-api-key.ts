import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { env } from '@api/config/env';
import { isUserOrgAdmin } from '@cio/db/queries/organization';

export const orgAdminOrApiKeyMiddleware = async (c: Context, next: Next) => {
  try {
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

    const user = c.get('user');
    const authHeader = c.req.header('Authorization');
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;
    const isApiKeyRequest = Boolean(apiKey && env.PRIVATE_SERVER_KEY && apiKey === env.PRIVATE_SERVER_KEY);
    const actorId = user?.id ?? c.req.header('x-cio-actor-id');

    if (!actorId) {
      return c.json(
        {
          success: false,
          error: 'Actor ID is required',
          code: 'ACTOR_ID_REQUIRED'
        },
        400
      );
    }

    const isAdmin = await isUserOrgAdmin(orgId, actorId);
    if (!isAdmin) {
      return c.json(
        {
          success: false,
          error: 'Only organization admins can perform this action',
          code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
        },
        403
      );
    }

    if (!user && !isApiKeyRequest) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          code: ErrorCodes.UNAUTHORIZED
        },
        401
      );
    }

    c.set('actorId', actorId);
    await next();
  } catch (error) {
    console.error('Error in orgAdminOrApiKeyMiddleware:', error);
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
