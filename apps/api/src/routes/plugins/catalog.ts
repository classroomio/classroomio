import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { getCatalogPluginDetails, getCatalogPluginVersion, listCatalogPlugins } from '@api/services/plugin';

export const pluginCatalogRouter = new Hono()
  .get('/', async (c) => {
    try {
      const plugins = await listCatalogPlugins({ status: 'published' });

      return c.json({ success: true, data: plugins }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugins catalog');
    }
  })
  .get('/:id', async (c) => {
    const pluginId = c.req.param('id');

    try {
      const details = await getCatalogPluginDetails(pluginId);

      return c.json({ success: true, data: details }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin details');
    }
  })
  .get('/:id/versions/:version', async (c) => {
    const pluginId = c.req.param('id');
    const version = c.req.param('version');

    try {
      const versionData = await getCatalogPluginVersion(pluginId, version);

      return c.json({ success: true, data: versionData }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin version');
    }
  });
