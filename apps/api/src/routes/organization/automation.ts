import {
  ZCreateOrganizationApiKey,
  ZOrganizationAutomationUsageQuery,
  ZListOrganizationApiKeysQuery,
  ZOrganizationApiKeyParam
} from '@cio/utils/validation/organization';
import {
  createOrganizationApiKeyService,
  listOrganizationApiKeysService,
  revokeOrganizationApiKeyService,
  rotateOrganizationApiKeyService
} from '@api/services/organization/automation-key';
import { getOrganizationAutomationUsageSummaryService } from '@api/services/organization/automation-usage';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

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
