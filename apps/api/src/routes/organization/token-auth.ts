import {
  activateTokenAuth,
  createTokenAuthConfig,
  deleteTokenAuthConfig,
  getTokenAuthStatus,
  rotateTokenAuthSecret
} from '@api/services/organization/token-auth';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const ZActivateBody = z.object({ isActive: z.boolean() });

export const organizationTokenAuthRouter = new Hono()
  /**
   * GET /organization/token-auth
   * Get token auth status (never returns full secret)
   */
  .get('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const result = await getTokenAuthStatus(orgId);

      if (!result) {
        return c.json({ success: true, data: null });
      }

      return c.json({ success: true, data: result });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch token auth status');
    }
  })

  /**
   * POST /organization/token-auth
   * Create token auth config (generate secret). Returns secret once.
   */
  .post('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;

      const { secret, config } = await createTokenAuthConfig(orgId, user.id);

      return c.json(
        {
          success: true,
          data: {
            id: config.id,
            organizationId: config.organizationId,
            isActive: config.isActive,
            createdAt: config.createdAt,
            secret
          }
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create token auth');
    }
  })

  /**
   * POST /organization/token-auth/rotate
   * Rotate signing secret. Returns new secret once.
   */
  .post('/rotate', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { secret } = await rotateTokenAuthSecret(orgId);

      return c.json({ success: true, data: { secret } });
    } catch (error) {
      return handleError(c, error, 'Failed to rotate token auth secret');
    }
  })

  /**
   * DELETE /organization/token-auth
   * Remove token auth config
   */
  .delete('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;

      await deleteTokenAuthConfig(orgId);

      return c.json({ success: true });
    } catch (error) {
      return handleError(c, error, 'Failed to delete token auth');
    }
  })

  /**
   * PUT /organization/token-auth/activate
   * Toggle active/inactive
   */
  .put('/activate', authMiddleware, orgAdminMiddleware, zValidator('json', ZActivateBody), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { isActive } = c.req.valid('json');

      const result = await activateTokenAuth(orgId, isActive);

      return c.json({ success: true, data: result });
    } catch (error) {
      return handleError(c, error, 'Failed to update token auth activation');
    }
  });
