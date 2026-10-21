import { Hono } from '@api/utils/hono';
import { automationKeyMiddleware } from '@api/middlewares/automation-key';
import { handleError } from '@api/utils/errors';
import { assertPluginDevelopmentAccess, publishDevelopmentRelease } from '@api/services/plugin';
import { ZCreateDevelopmentRelease } from '@cio/utils/validation/plugin';
import { zValidator } from '@hono/zod-validator';

export const pluginDevelopmentRouter = new Hono().post(
  '/releases',
  async (c, next) => {
    if (process.env.NODE_ENV === 'production') {
      return c.json({ success: false, message: 'Not found' }, 404);
    }

    await next();
  },
  automationKeyMiddleware,
  zValidator('json', ZCreateDevelopmentRelease),
  async (c) => {
    try {
      const payload = c.req.valid('json');
      const automationKey = c.get('automationKey')!;
      await assertPluginDevelopmentAccess(automationKey, payload.organizationId);

      const archive = Buffer.from(payload.archive, 'base64');
      const result = await publishDevelopmentRelease({
        manifest: payload.manifest,
        artifactDigest: payload.artifactDigest,
        archive,
        organizationId: payload.organizationId,
        profileId: automationKey.createdByProfileId
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to publish development release');
    }
  }
);
