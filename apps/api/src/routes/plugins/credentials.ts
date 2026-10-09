import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZCreatePluginCredential } from '@cio/utils/validation/plugin';
import { createCredential, listCredentials, revokeCredential } from '@api/services/plugin';

export const pluginCredentialsRouter = new Hono()
  .get('/:installationId/credentials', authMiddleware, orgAdminMiddleware, async (c) => {
    const installationId = c.req.param('installationId');

    try {
      const credentials = await listCredentials(installationId);

      return c.json({ success: true, data: credentials }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list plugin credentials');
    }
  })
  .post(
    '/:installationId/credentials',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZCreatePluginCredential),
    async (c) => {
      const user = c.get('user')!;
      const installationId = c.req.param('installationId');
      const input = c.req.valid('json');

      try {
        const result = await createCredential(installationId, input.label, input.expiresInDays, user.id);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create plugin credential');
      }
    }
  )
  .delete('/:installationId/credentials/:credentialId', authMiddleware, orgAdminMiddleware, async (c) => {
    const user = c.get('user')!;
    const installationId = c.req.param('installationId');
    const credentialId = c.req.param('credentialId');

    try {
      const revoked = await revokeCredential(installationId, credentialId, user.id);

      return c.json({ success: true, data: revoked }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to revoke plugin credential');
    }
  });
