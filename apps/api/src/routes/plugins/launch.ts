import * as z from 'zod';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZPluginLaunchCodeExchange } from '@cio/utils/validation/plugin';
import { createLaunchCodeForSession, exchangeLaunchCodeForClaims } from '@api/services/plugin';

const ZCreateLaunchCodeRequest = z.object({
  target: z.string().trim().max(64).optional(),
  audience: z.string().trim().max(255).optional(),
  nonce: z.string().trim().max(128).optional()
});

export const pluginLaunchRouter = new Hono()
  .post('/:installationId/launch-code', authMiddleware, zValidator('json', ZCreateLaunchCodeRequest), async (c) => {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id');
    const installationId = c.req.param('installationId');
    const input = c.req.valid('json');

    try {
      const launchCode = await createLaunchCodeForSession({
        installationId,
        userId: user.id,
        organizationId: orgId,
        contributionTarget: input.target,
        audience: input.audience,
        handshakeNonce: input.nonce
      });

      return c.json({ success: true, data: launchCode }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to create plugin launch code');
    }
  })
  .post('/exchange', zValidator('json', ZPluginLaunchCodeExchange), async (c) => {
    const input = c.req.valid('json');

    try {
      const claims = await exchangeLaunchCodeForClaims({
        code: input.code,
        clientSecret: input.clientSecret
      });

      return c.json({ success: true, data: claims }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to exchange plugin launch code');
    }
  });
