import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { handleError } from '@api/utils/errors';
import { ZCreateApiKey, ZRevokeApiKeyParam } from '@cio/utils/validation/public-api-key';
import { createApiKey, listApiKeys, revokeApiKey } from '@api/services/public-api';

export const apiKeyRouter = new Hono()
  .post('/api-key', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateApiKey), async (c) => {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id')!;
    const data = c.req.valid('json');

    try {
      const result = await createApiKey(orgId, user.id, data.name);

      return c.json(
        {
          success: true,
          data: result
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create API key');
    }
  })
  .get('/api-key', authMiddleware, orgAdminMiddleware, async (c) => {
    const orgId = c.req.header('cio-org-id')!;

    try {
      const keys = await listApiKeys(orgId);

      return c.json(
        {
          success: true,
          data: keys
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to list API keys');
    }
  })
  .delete('/api-key/:keyId', authMiddleware, orgAdminMiddleware, zValidator('param', ZRevokeApiKeyParam), async (c) => {
    const orgId = c.req.header('cio-org-id')!;
    const { keyId } = c.req.valid('param');

    try {
      await revokeApiKey(keyId, orgId);

      return c.json(
        {
          success: true,
          message: 'API key revoked successfully'
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to revoke API key');
    }
  });
