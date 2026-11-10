import { Context, Next } from 'hono';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { authenticateOAuthAccessTokenService, type TOAuthGrant } from '@api/services/oauth/oauth';
import { touchOrganizationApiKeyLastUsedService } from '@api/services/organization/automation-key';
import { normalizeClientName } from '@api/utils/change-attribution';
import { isInternalRequest } from '@api/utils/internal-request';

export const AUTOMATION_KEY_PREFIX = 'cio_';

async function authenticateOAuthRequest(c: Context): Promise<TOAuthGrant> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  const resource = isInternalRequest(c.req.raw.headers) ? 'any' : 'api';

  return authenticateOAuthAccessTokenService(accessToken, resource);
}

export const oauthTokenMiddleware = async (c: Context, next: Next) => {
  let grant: TOAuthGrant;

  try {
    grant = await authenticateOAuthRequest(c);
  } catch (error) {
    if (!(error instanceof AppError)) throw error;

    if (error.statusCode === 403) {
      return c.json({ success: false, error: error.message, code: error.code }, 403);
    }

    c.header('WWW-Authenticate', 'Bearer error="invalid_token"');

    return c.json({ success: false, error: error.message, code: ErrorCodes.UNAUTHORIZED }, 401);
  }

  c.set('automationKey', grant.key);
  c.set('oauthClientId', grant.clientId);
  c.set('oauthPlanName', grant.planName);
  c.set('orgId', grant.key.organizationId);
  c.set('actorId', grant.key.createdByProfileId);
  c.set('clientName', normalizeClientName(grant.clientName));

  await touchOrganizationApiKeyLastUsedService(grant.key);
  await next();
};
