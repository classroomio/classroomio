import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import {
  ZInstallPlugin,
  ZPluginApiStorageScope,
  ZPluginApiStorageSet,
  ZUpdateInstallationSettings,
  ZUpdateInstallationStatus,
  ZUpdateOrgApprovalStatus
} from '@cio/utils/validation/plugin';
import { z } from 'zod';
import {
  changeInstallationSettings,
  changeInstallationStatus,
  changeOrgApproval,
  getInstallation,
  installPlugin,
  listOrgPlugins,
  resolveOrgContributions
} from '@api/services/plugin';
import { deleteStorageValue, getStorageValue, listStorageRecords, setStorageValue } from '@api/services/plugin/storage';

const ZStorageScopeQuery = z.object({
  scope: ZPluginApiStorageScope.default('organization')
});

/**
 * Dashboard-facing installation management routes.
 *
 * Plugin resource data is intentionally not exposed here. Plugins access the
 * versioned public API at /plugin-api/v1 using a backend access token.
 */
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
  .get('/:installationId/storage/:namespace/:key', authMiddleware, orgMemberMiddleware, async (c) => {
    const user = c.get('user')!;
    const orgId = c.get('orgId') as string;
    const installationId = c.req.param('installationId');
    const namespace = c.req.param('namespace');
    const key = c.req.param('key');
    const queryResult = ZStorageScopeQuery.safeParse(c.req.query());

    if (!queryResult.success) {
      return handleError(c, queryResult.error, 'Invalid plugin storage scope');
    }

    try {
      const value = await getStorageValue(installationId, orgId, user.id, namespace, key, queryResult.data.scope);
      return c.json({ success: true, data: { value } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load plugin storage');
    }
  })
  .get('/:installationId/storage/:namespace', authMiddleware, orgMemberMiddleware, async (c) => {
    const user = c.get('user')!;
    const orgId = c.get('orgId') as string;
    const installationId = c.req.param('installationId');
    const namespace = c.req.param('namespace');
    const queryResult = ZStorageScopeQuery.safeParse(c.req.query());

    if (!queryResult.success) {
      return handleError(c, queryResult.error, 'Invalid plugin storage scope');
    }

    try {
      const records = await listStorageRecords(installationId, orgId, user.id, namespace, queryResult.data.scope);
      return c.json({ success: true, data: { items: records } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list plugin storage');
    }
  })
  .put(
    '/:installationId/storage/:namespace/:key',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZPluginApiStorageSet),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const installationId = c.req.param('installationId');
      const namespace = c.req.param('namespace');
      const key = c.req.param('key');
      const input = c.req.valid('json');

      try {
        const record = await setStorageValue(installationId, orgId, user.id, namespace, key, input.value, input.scope);
        return c.json({ success: true, data: record }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to save plugin storage');
      }
    }
  )
  .delete('/:installationId/storage/:namespace/:key', authMiddleware, orgMemberMiddleware, async (c) => {
    const user = c.get('user')!;
    const orgId = c.get('orgId') as string;
    const installationId = c.req.param('installationId');
    const namespace = c.req.param('namespace');
    const key = c.req.param('key');
    const queryResult = ZStorageScopeQuery.safeParse(c.req.query());

    if (!queryResult.success) {
      return handleError(c, queryResult.error, 'Invalid plugin storage scope');
    }

    try {
      const deleted = await deleteStorageValue(installationId, orgId, user.id, namespace, key, queryResult.data.scope);
      return c.json({ success: true, data: { deleted } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete plugin storage');
    }
  })
  .get('/:installationId', authMiddleware, orgMemberMiddleware, async (c) => {
    const installationId = c.req.param('installationId');
    const orgId = c.get('orgId') as string;

    try {
      const details = await getInstallation(installationId, orgId);

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
      const orgId = c.get('orgId') as string;
      const installationId = c.req.param('installationId');
      const { status } = c.req.valid('json');

      try {
        const updated = await changeInstallationStatus(installationId, orgId, status, user.id);

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
      const orgId = c.get('orgId') as string;
      const installationId = c.req.param('installationId');
      const { settings } = c.req.valid('json');

      try {
        const updated = await changeInstallationSettings(installationId, orgId, settings, user.id);

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
      const orgId = c.get('orgId') as string;
      const installationId = c.req.param('installationId');
      const { approval } = c.req.valid('json');

      try {
        const updated = await changeOrgApproval(installationId, orgId, approval, user.id);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update plugin organization approval');
      }
    }
  );
