import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZPluginStorageSet } from '@cio/utils/validation/plugin';
import { deleteStorageValue, getStorageValue, setStorageValue } from '@api/services/plugin';

export const pluginStorageRouter = new Hono()
  .get('/:installationId/storage/:namespace/:key', authMiddleware, async (c) => {
    const installationId = c.req.param('installationId');
    const namespace = c.req.param('namespace');
    const key = c.req.param('key');

    try {
      const value = await getStorageValue(installationId, namespace, key);

      return c.json({ success: true, data: value }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get plugin storage value');
    }
  })
  .put('/:installationId/storage', authMiddleware, zValidator('json', ZPluginStorageSet), async (c) => {
    const installationId = c.req.param('installationId');
    const input = c.req.valid('json');

    try {
      await setStorageValue(installationId, input.namespace, input.key, input.value);

      return c.json({ success: true, data: null }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to set plugin storage value');
    }
  })
  .delete('/:installationId/storage/:namespace/:key', authMiddleware, async (c) => {
    const installationId = c.req.param('installationId');
    const namespace = c.req.param('namespace');
    const key = c.req.param('key');

    try {
      const deleted = await deleteStorageValue(installationId, namespace, key);

      return c.json({ success: true, data: { deleted } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete plugin storage value');
    }
  });
