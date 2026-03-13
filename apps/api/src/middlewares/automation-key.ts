import { Context, Next } from 'hono';

import {
  authenticateOrganizationApiKeyService,
  touchOrganizationApiKeyLastUsedService
} from '@api/services/organization/automation-key';

export const automationKeyMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        401
      );
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();
    const automationKey = await authenticateOrganizationApiKeyService(apiKey);

    c.set('automationKey', automationKey);
    c.set('orgId', automationKey.organizationId);
    c.set('actorId', automationKey.createdByProfileId);

    await touchOrganizationApiKeyLastUsedService(automationKey);
    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unauthorized',
        code: 'UNAUTHORIZED'
      },
      401
    );
  }
};
