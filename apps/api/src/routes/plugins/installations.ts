import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import {
  ZInstallPlugin,
  ZUpdateInstallationSettings,
  ZUpdateInstallationStatus,
  ZUpdateOrgApprovalStatus
} from '@cio/utils/validation/plugin';
import {
  changeInstallationSettings,
  changeInstallationStatus,
  changeOrgApproval,
  getInstallation,
  installPlugin,
  listOrgPlugins,
  resolveOrgContributions
} from '@api/services/plugin';

export const pluginInstallationsRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, async (c) => {
    const orgId = c.get('orgId') as string;

    try {
      const installations = await listOrgPlugins(orgId);

      return c.json({ success: true, data: installations }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch organization plugin installations');
    }
  })
  .get('/contributions', authMiddleware, orgMemberMiddleware, async (c) => {
    const orgId = c.get('orgId') as string;
    const target = c.req.query('target');

    try {
      const contributions = await resolveOrgContributions(orgId, target);

      return c.json({ success: true, data: contributions }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to resolve organization plugin contributions');
    }
  })
  .post('/:id/install', authMiddleware, orgAdminMiddleware, zValidator('json', ZInstallPlugin), async (c) => {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id')!;
    const pluginId = c.req.param('id');
    const input = c.req.valid('json');

    try {
      const result = await installPlugin({
        pluginId,
        version: input.version,
        ownerType: input.ownerType,
        organizationId: orgId,
        userId: user.id,
        installedByProfileId: user.id,
        settings: input.settings
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to install plugin');
    }
  })
  .get('/:installationId', authMiddleware, async (c) => {
    const installationId = c.req.param('installationId');

    try {
      const details = await getInstallation(installationId);

      return c.json({ success: true, data: details }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch installation details');
    }
  })
  .patch(
    '/:installationId/status',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZUpdateInstallationStatus),
    async (c) => {
      const user = c.get('user')!;
      const installationId = c.req.param('installationId');
      const { status } = c.req.valid('json');

      try {
        const updated = await changeInstallationStatus(installationId, status, user.id);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update installation status');
      }
    }
  )
  .patch(
    '/:installationId/settings',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZUpdateInstallationSettings),
    async (c) => {
      const user = c.get('user')!;
      const installationId = c.req.param('installationId');
      const { settings } = c.req.valid('json');

      try {
        const updated = await changeInstallationSettings(installationId, settings, user.id);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update installation settings');
      }
    }
  )
  .patch(
    '/:installationId/approval',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZUpdateOrgApprovalStatus),
    async (c) => {
      const user = c.get('user')!;
      const installationId = c.req.param('installationId');
      const { approval } = c.req.valid('json');

      try {
        const updated = await changeOrgApproval(installationId, approval, user.id);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update plugin organization approval');
      }
    }
  );
