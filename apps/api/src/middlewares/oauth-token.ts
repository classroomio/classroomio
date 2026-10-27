import { Context, Next } from 'hono';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { authenticateOAuthAccessTokenService } from '@api/services/oauth/oauth';
import { touchOrganizationApiKeyLastUsedService } from '@api/services/organization/automation-key';

export const AUTOMATION_KEY_PREFIX = 'cio_';

export const oauthTokenMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const grantKey = await authenticateOAuthAccessTokenService(accessToken);

    c.set('automationKey', grantKey);
    c.set('orgId', grantKey.organizationId);
    c.set('actorId', grantKey.createdByProfileId);

    await touchOrganizationApiKeyLastUsedService(grantKey);
    await next();
  } catch (error) {
    const message = error instanceof AppError ? error.message : 'Unauthorized';

    return c.json({ success: false, error: message, code: ErrorCodes.UNAUTHORIZED }, 401);
  }
};
