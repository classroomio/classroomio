import { Context, Next } from 'hono';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { authenticateOAuthAccessTokenService } from '@api/services/oauth/oauth';
import { touchOrganizationApiKeyLastUsedService } from '@api/services/organization/automation-key';
import { isInternalRequest } from '@api/utils/internal-request';

export const AUTOMATION_KEY_PREFIX = 'cio_';

export const oauthTokenMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const resource = isInternalRequest(c.req.raw.headers) ? 'any' : 'api';
    const grantKey = await authenticateOAuthAccessTokenService(accessToken, resource);

    c.set('automationKey', grantKey);
    c.set('orgId', grantKey.organizationId);
    c.set('actorId', grantKey.createdByProfileId);

    await touchOrganizationApiKeyLastUsedService(grantKey);
    await next();
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 403) {
      return c.json({ success: false, error: error.message, code: error.code }, 403);
    }

    const message = error instanceof AppError ? error.message : 'Unauthorized';

    return c.json({ success: false, error: message, code: ErrorCodes.UNAUTHORIZED }, 401);
  }
};
