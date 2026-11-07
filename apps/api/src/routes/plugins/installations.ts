import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import {
  ZInstallPlugin,
  ZPluginInstallationParam,
  ZPluginStorageKeyParam,
  ZPluginStorageNamespaceParam,
  ZPluginStorageQuery,
  ZPluginStoragePut,
  ZUninstallPlugin,
  ZUpdateInstallationSettings,
  ZUpdateInstallationStatus,
  ZUpdateOrgApprovalStatus
} from '@cio/utils/validation/plugin';
import {
  changeInstallationSettings,
  changeInstallationStatus,
  changeOrgApproval,
  getInstallation,
  getPluginUninstallImpact,
  installPlugin,
  listOrgPlugins,
  resolveOrgContributions,
  deleteStorageValue,
  deleteStorageData,
  getStorageValue,
  getStorageRecord,
  getStorageUsage,
  exportStorageData,
  listStorageRecords,
  setStorageValue,
  uninstallPlugin
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
    const userRole = c.get('userRole') as number | undefined;
    const role = userRole === 1 ? 'admin' : userRole === 2 ? 'tutor' : 'learner';
    const pageMode = c.req.query('pageMode') === 'edit' ? 'edit' : 'view';

    try {
      const contributions = await resolveOrgContributions(orgId, target, { role, pageMode });

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
        settings: input.settings,
        allowDowngrade: input.allowDowngrade
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to install plugin');
    }
  })
  .get(
    '/:installationId/uninstall-impact',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZPluginInstallationParam),
    async (c) => {
      const orgId = c.get('orgId') as string;
      const { installationId } = c.req.valid('param');

      try {
        const impact = await getPluginUninstallImpact(installationId, orgId);
        return c.json({ success: true, data: impact }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to calculate plugin uninstall impact');
      }
    }
  )
  .post(
    '/:installationId/uninstall',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZPluginInstallationParam),
    zValidator('json', ZUninstallPlugin),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const { installationId } = c.req.valid('param');
      const options = c.req.valid('json');

      try {
        const result = await uninstallPlugin(installationId, orgId, options, user.id);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to uninstall plugin');
      }
    }
  )
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
  .get(
    '/:installationId/storage/:namespace/:key',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZPluginStorageKeyParam),
    zValidator('query', ZPluginStorageQuery),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const userRole = c.get('userRole') as number | undefined;
      const { installationId, namespace, key } = c.req.valid('param');
      const { scope, resourceType, resourceId } = c.req.valid('query');

      try {
        const value = await getStorageValue(
          installationId,
          orgId,
          user.id,
          namespace,
          key,
          scope,
          userRole,
          resourceType,
          resourceId
        );
        return c.json({ success: true, data: value }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch plugin storage item');
      }
    }
  )
  .put(
    '/:installationId/storage/:namespace/:key',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZPluginStorageKeyParam),
    zValidator('json', ZPluginStoragePut),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const userRole = c.get('userRole') as number | undefined;
      const { installationId, namespace, key } = c.req.valid('param');
      const { value, scope, resourceType, resourceId, schemaVersion, expectedVersion } = c.req.valid('json');

      try {
        const result = await setStorageValue(
          installationId,
          orgId,
          user.id,
          namespace,
          key,
          value,
          scope,
          userRole,
          resourceType,
          resourceId,
          schemaVersion,
          expectedVersion
        );
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to set plugin storage item');
      }
    }
  )
  .delete(
    '/:installationId/storage/:namespace/:key',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZPluginStorageKeyParam),
    zValidator('query', ZPluginStorageQuery),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const userRole = c.get('userRole') as number | undefined;
      const { installationId, namespace, key } = c.req.valid('param');
      const { scope, resourceType, resourceId } = c.req.valid('query');

      try {
        const result = await deleteStorageValue(
          installationId,
          orgId,
          user.id,
          namespace,
          key,
          scope,
          userRole,
          resourceType,
          resourceId
        );
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete plugin storage item');
      }
    }
  )
  .get(
    '/:installationId/storage/:namespace',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZPluginStorageNamespaceParam),
    zValidator('query', ZPluginStorageQuery),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const userRole = c.get('userRole') as number | undefined;
      const { installationId, namespace } = c.req.valid('param');
      const { scope, resourceType, resourceId, cursor, limit } = c.req.valid('query');

      try {
        const records = await listStorageRecords(
          installationId,
          orgId,
          user.id,
          namespace,
          scope,
          userRole,
          resourceType,
          resourceId,
          cursor,
          limit
        );
        return c.json({ success: true, data: records }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list plugin storage namespace');
      }
    }
  )
  .get(
    '/:installationId/storage-record/:namespace/:key',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZPluginStorageKeyParam),
    zValidator('query', ZPluginStorageQuery),
    async (c) => {
      const user = c.get('user')!;
      const orgId = c.get('orgId') as string;
      const userRole = c.get('userRole') as number | undefined;
      const { installationId, namespace, key } = c.req.valid('param');
      const { scope, resourceType, resourceId } = c.req.valid('query');

      try {
        const record = await getStorageRecord(
          installationId,
          orgId,
          user.id,
          namespace,
          key,
          scope,
          userRole,
          resourceType,
          resourceId
        );
        return c.json({ success: true, data: record }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch plugin storage record');
      }
    }
  )
  .get('/:installationId/storage-usage', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const result = await getStorageUsage(c.req.param('installationId'), c.get('orgId') as string);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin storage usage');
    }
  })
  .get('/:installationId/storage-export', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const result = await exportStorageData(c.req.param('installationId'), c.get('orgId') as string);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to export plugin storage');
    }
  })
  .delete('/:installationId/storage-data', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const result = await deleteStorageData(c.req.param('installationId'), c.get('orgId') as string);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete plugin storage');
    }
  })
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
