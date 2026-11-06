import {
  ZCreateOrganizationApiKey,
  ZOrganizationAutomationUsageQuery,
  ZListOrganizationApiKeysQuery,
  ZOAuthConnectedAppParam,
  ZOrganizationApiKeyParam
} from '@cio/utils/validation/organization';
import {
  createOrganizationApiKeyService,
  listOrganizationApiKeysService,
  revokeOrganizationApiKeyService,
  rotateOrganizationApiKeyService
} from '@api/services/organization/automation-key';
import { listOAuthConnectedAppsService, revokeOAuthConnectedAppService } from '@api/services/oauth/oauth';
import { getOrganizationAutomationUsageSummaryService } from '@api/services/organization/automation-usage';
import { getZapierConnectionsService, redeliverZapierTriggerFailuresService } from '@api/services/organization/zapier';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { ZZapierTriggerParam } from '@cio/utils/validation/automation';
import { createRateLimiter } from '@api/middlewares/rate-limiter';

const zapierRedeliverRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many redelivery requests. Please try again shortly.',
  keyGenerator: (c) => `zapier_redeliver:${c.req.header('cio-org-id') ?? 'unknown'}`
});

export const automationRouter = new Hono()
  .get(
    '/usage',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('query', ZOrganizationAutomationUsageQuery),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const query = c.req.valid('query');
        const usage = await getOrganizationAutomationUsageSummaryService(orgId, query.type);

        return c.json({ success: true, data: usage }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load organization automation usage');
      }
    }
  )
  .get('/connected-apps', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const apps = await listOAuthConnectedAppsService(orgId);

      return c.json({ success: true, data: apps }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list connected apps');
    }
  })
  .get('/zapier', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const zapier = await getZapierConnectionsService(orgId);

      return c.json({ success: true, data: zapier }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load Zapier connections');
    }
  })
  .delete(
    '/connected-apps/:consentId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZOAuthConnectedAppParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { consentId } = c.req.valid('param');
        await revokeOAuthConnectedAppService(orgId, consentId);

        return c.json({ success: true, data: { consentId } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to revoke connected app');
      }
    }
  )
  .get('/keys', authMiddleware, orgAdminMiddleware, zValidator('query', ZListOrganizationApiKeysQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');
      const keys = await listOrganizationApiKeysService(orgId, query);

      return c.json({ success: true, data: keys }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list organization automation keys');
    }
  })
  .post('/keys', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateOrganizationApiKey), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const payload = c.req.valid('json');
      const key = await createOrganizationApiKeyService(orgId, user.id, payload);

      return c.json({ success: true, data: key }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create organization automation key');
    }
  })
  .delete(
    '/keys/:keyId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZOrganizationApiKeyParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { keyId } = c.req.valid('param');
        const key = await revokeOrganizationApiKeyService(orgId, keyId);

        return c.json({ success: true, data: key }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to revoke organization automation key');
      }
    }
  )
  .post(
    '/zapier/triggers/:triggerId/redeliver',
    authMiddleware,
    orgAdminMiddleware,
    zapierRedeliverRateLimit,
    zValidator('param', ZZapierTriggerParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { triggerId } = c.req.valid('param');
        const data = await redeliverZapierTriggerFailuresService(orgId, triggerId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to redeliver Zapier trigger events');
      }
    }
  )
  .post(
    '/keys/:keyId/rotate',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZOrganizationApiKeyParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { keyId } = c.req.valid('param');
        const key = await rotateOrganizationApiKeyService(orgId, keyId);

        return c.json({ success: true, data: key }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to rotate organization automation key');
      }
    }
  );
