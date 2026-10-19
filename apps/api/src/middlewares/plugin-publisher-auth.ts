import type { Context, Next } from 'hono';

import {
  authenticateOrganizationApiKeyService,
  touchOrganizationApiKeyLastUsedService
} from '@api/services/organization/automation-key';
import { ErrorCodes } from '@api/utils/errors';

export const pluginPublisherAuthMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');
  const session = c.get('session');
  if (user && session) {
    c.set('actorId', user.id);
    await next();

    return;
  }

  const authorization = c.req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return c.json(
      { success: false, error: 'Publisher authentication is required', code: ErrorCodes.UNAUTHORIZED },
      401
    );
  }

  try {
    const token = authorization.slice('Bearer '.length).trim();
    const publisherKey = await authenticateOrganizationApiKeyService(token);
    if (publisherKey.type !== 'api' || !(publisherKey.scopes ?? []).includes('plugin:publish')) {
      return c.json(
        { success: false, error: 'API key is missing plugin:publish scope', code: ErrorCodes.FORBIDDEN },
        403
      );
    }

    c.set('actorId', publisherKey.createdByProfileId);
    c.set('orgId', publisherKey.organizationId);
    c.set('automationKey', publisherKey);
    await touchOrganizationApiKeyLastUsedService(publisherKey);
    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid publisher token', code: ErrorCodes.UNAUTHORIZED }, 401);
  }
};
