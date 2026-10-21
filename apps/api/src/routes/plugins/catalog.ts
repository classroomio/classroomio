import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { getCatalogPluginDetails, getCatalogPluginVersion, listCatalogPlugins } from '@api/services/plugin';

export const pluginCatalogRouter = new Hono()
  .get('/', async (c) => {
    try {
      const requestedOrganizationId = c.req.header('cio-org-id');
      const organizationRoles = c.get('orgRoles');
      const organizationId =
        requestedOrganizationId && organizationRoles[requestedOrganizationId] ? requestedOrganizationId : undefined;
      const plugins = await listCatalogPlugins({ status: 'published', organizationId });

      return c.json({ success: true, data: plugins }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugins catalog');
    }
  })
  .get('/:id', async (c) => {
    const pluginId = c.req.param('id');

    try {
      const requestedOrganizationId = c.req.header('cio-org-id');
      const organizationRoles = c.get('orgRoles');
      const organizationId =
        requestedOrganizationId && organizationRoles[requestedOrganizationId] ? requestedOrganizationId : undefined;
      const details = await getCatalogPluginDetails(pluginId, organizationId);

      return c.json({ success: true, data: details }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin details');
    }
  })
  .get('/:id/versions/:version', async (c) => {
    const pluginId = c.req.param('id');
    const version = c.req.param('version');

    try {
      const requestedOrganizationId = c.req.header('cio-org-id');
      const organizationRoles = c.get('orgRoles');
      const organizationId =
        requestedOrganizationId && organizationRoles[requestedOrganizationId] ? requestedOrganizationId : undefined;
      const versionData = await getCatalogPluginVersion(pluginId, version, organizationId);

      return c.json({ success: true, data: versionData }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin version');
    }
  });
