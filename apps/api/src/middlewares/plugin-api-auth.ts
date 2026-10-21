import type { MiddlewareHandler } from 'hono';
import type { AuthSession } from '@api/types/auth';
import { verifyPluginApiAccessToken } from '@api/services/plugin/access-token';
import { AppError } from '@api/utils/errors';
import { handlePluginApiError } from '@api/routes/plugin-api/errors';

export const pluginApiAuthMiddleware: MiddlewareHandler<AuthSession> = async (c, next) => {
  try {
    const authorization = c.req.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError('A plugin API bearer token is required', 'UNAUTHORIZED', 401);
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError('A plugin API bearer token is required', 'UNAUTHORIZED', 401);
    }

    const claims = await verifyPluginApiAccessToken(token);
    c.set('pluginApiClaims', claims);
    c.set('actorId', claims.sub);
    c.set('orgId', claims.organizationId);

    await next();
  } catch (error) {
    return handlePluginApiError(c, error, 'Plugin API authentication failed');
  }
};
