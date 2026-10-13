import * as z from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { handleError } from '@api/utils/errors';
import {
  processPendingOutboxDeliveries,
  publishOfficialPluginRelease,
  provisionPluginBackendClient,
  revokePluginBackendClientService,
  rotatePluginBackendClient
} from '@api/services/plugin';

const ZProvisionBackendClient = z
  .object({
    pluginId: z.string().trim().min(3).max(128),
    label: z.string().trim().min(1).max(120).optional()
  })
  .strict();

const ZBackendClientId = z
  .object({
    clientId: z.string().trim().min(1).max(256)
  })
  .strict();

const ZOfficialPluginRelease = z
  .object({
    manifest: z.record(z.string(), z.unknown()),
    artifactDigest: z.string().trim(),
    signature: z.string().trim().min(1).optional()
  })
  .strict();

export const internalPluginsRouter = new Hono()
  .post('/releases', apiKeyMiddleware, zValidator('json', ZOfficialPluginRelease), async (c) => {
    try {
      const input = c.req.valid('json');
      const result = await publishOfficialPluginRelease({
        manifest: input.manifest,
        artifactDigest: input.artifactDigest,
        signature: input.signature
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to publish official plugin release');
    }
  })
  .post('/backend-clients', apiKeyMiddleware, zValidator('json', ZProvisionBackendClient), async (c) => {
    try {
      const input = c.req.valid('json');
      const result = await provisionPluginBackendClient(input.pluginId, input.label);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to provision plugin backend client');
    }
  })
  .post('/backend-clients/rotate', apiKeyMiddleware, zValidator('json', ZBackendClientId), async (c) => {
    try {
      const { clientId } = c.req.valid('json');
      const result = await rotatePluginBackendClient(clientId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to rotate plugin backend client');
    }
  })
  .post('/backend-clients/revoke', apiKeyMiddleware, zValidator('json', ZBackendClientId), async (c) => {
    try {
      const { clientId } = c.req.valid('json');
      const result = await revokePluginBackendClientService(clientId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to revoke plugin backend client');
    }
  })
  .post('/events/process', apiKeyMiddleware, async (c) => {
    try {
      const processed = await processPendingOutboxDeliveries(50);

      return c.json({ success: true, data: { processed } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to process plugin event deliveries');
    }
  });
