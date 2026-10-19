import { Hono } from '@api/utils/hono';
import { pluginPublisherAuthMiddleware } from '@api/middlewares/plugin-publisher-auth';
import { handleError } from '@api/utils/errors';
import { publishDevelopmentRelease } from '@api/services/plugin';
import { ROLE } from '@cio/utils/constants';
import { ZCreateDevelopmentRelease } from '@cio/utils/validation/plugin';
import { zValidator } from '@hono/zod-validator';

export const pluginDevelopmentRouter = new Hono().post(
  '/releases',
  pluginPublisherAuthMiddleware,
  zValidator('json', ZCreateDevelopmentRelease),
  async (c) => {
    try {
      const payload = c.req.valid('json');
      const publisherKey = c.get('automationKey');
      const organizationRoles = c.get('orgRoles');
      const keyCanPublish = publisherKey?.organizationId === payload.organizationId;
      const sessionCanPublish = !publisherKey && organizationRoles[payload.organizationId] === ROLE.ADMIN;
      if (!keyCanPublish && !sessionCanPublish) {
        return c.json({ success: false, message: 'Organization admin access is required' }, 403);
      }

      const archive = Buffer.from(payload.archive, 'base64');
      const result = await publishDevelopmentRelease({
        manifest: payload.manifest,
        artifactDigest: payload.artifactDigest,
        archive,
        organizationId: payload.organizationId,
        profileId: c.get('actorId')!
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to publish development release');
    }
  }
);
