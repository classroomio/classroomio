import * as z from 'zod';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZPluginLaunchCodeExchange } from '@cio/utils/validation/plugin';
import { createLaunchCodeForSession, exchangeLaunchCodeForClaims } from '@api/services/plugin';

const ZCreateLaunchCodeRequest = z
  .object({
    target: z.string().trim().min(1).max(64),
    audience: z.string().url().max(255),
    nonce: z.string().uuid(),
    resource: z
      .object({
        type: z.enum(['lesson', 'course', 'certificate', 'organization']),
        id: z.string().uuid()
      })
      .strict()
      .optional()
  })
  .strict();

export const pluginLaunchRouter = new Hono()
  .post(
    '/:installationId/launch-code',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZCreateLaunchCodeRequest),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const installationId = c.req.param('installationId');
      const input = c.req.valid('json');

      try {
        const launchCode = await createLaunchCodeForSession({
          installationId,
          userId: user.id,
          organizationId: orgId,
          contributionTarget: input.target,
          resource: input.resource,
          audience: input.audience,
          handshakeNonce: input.nonce
        });

        return c.json({ success: true, data: launchCode }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to create plugin launch code');
      }
    }
  )
  .post('/exchange', zValidator('json', ZPluginLaunchCodeExchange), async (c) => {
    const input = c.req.valid('json');

    try {
      const claims = await exchangeLaunchCodeForClaims({
        code: input.code,
        clientSecret: input.clientSecret,
        clientId: input.clientId
      });

      return c.json({ success: true, data: claims }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to exchange plugin launch code');
    }
  });
