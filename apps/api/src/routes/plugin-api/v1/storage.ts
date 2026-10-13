import { Hono } from '@api/utils/hono';
import {
  deleteStorageValue,
  getStorageRecord,
  listStorageRecords,
  setStorageValue
} from '@api/services/plugin/storage';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import { ZPluginApiStorageRecord, ZPluginApiStorageSet } from '@cio/utils/validation/plugin';
import { z } from 'zod';
import { describePluginApiRoute } from '../openapi';

const ZScopeQuery = z.object({
  scope: z.enum(['organization', 'user', 'owner']).default('organization')
});

export const pluginApiStorageRouter = new Hono()
  .get(
    '/:namespace/:key',
    describePluginApiRoute({
      operationId: 'pluginStorageGet',
      summary: 'Get a namespaced plugin storage record',
      scope: 'plugin.storage:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const namespace = c.req.param('namespace');
      const key = c.req.param('key');

      if (!claims.scopes.includes('plugin.storage:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission plugin.storage:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryParsed = ZScopeQuery.safeParse(c.req.query());
        if (!queryParsed.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const scope = queryParsed.data.scope;
        const record = await getStorageRecord(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          namespace,
          key,
          scope
        );

        if (!record) {
          throw new AppError(
            `Storage key "${key}" not found in namespace "${namespace}"`,
            'STORAGE_KEY_NOT_FOUND',
            404
          );
        }

        const data = ZPluginApiStorageRecord.parse(record);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.get',
          resource: `${namespace}:${key}`,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti, scope }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.get',
          resource: `${namespace}:${key}`,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to get plugin storage record');
      }
    }
  )
  .get(
    '/:namespace',
    describePluginApiRoute({
      operationId: 'pluginStorageList',
      summary: 'List a plugin storage namespace',
      scope: 'plugin.storage:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const namespace = c.req.param('namespace');

      if (!claims.scopes.includes('plugin.storage:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission plugin.storage:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryParsed = ZScopeQuery.safeParse(c.req.query());
        if (!queryParsed.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const scope = queryParsed.data.scope;
        const records = await listStorageRecords(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          namespace,
          scope
        );

        const items = z.array(ZPluginApiStorageRecord).parse(records);
        const data = { items };

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.list',
          resource: namespace,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti, scope }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.list',
          resource: namespace,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list plugin storage records');
      }
    }
  )
  .put(
    '/:namespace/:key',
    describePluginApiRoute({
      operationId: 'pluginStorageSet',
      summary: 'Set a namespaced plugin storage record',
      scope: 'plugin.storage:write'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const namespace = c.req.param('namespace');
      const key = c.req.param('key');

      if (!claims.scopes.includes('plugin.storage:write')) {
        return handlePluginApiError(
          c,
          new AppError('Permission plugin.storage:write is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const rawBody = await c.req.json().catch(() => null);
        const bodyParsed = ZPluginApiStorageSet.safeParse(rawBody);
        if (!bodyParsed.success) {
          throw new AppError('Invalid storage payload', 'VALIDATION_ERROR', 400);
        }

        const record = await setStorageValue(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          namespace,
          key,
          bodyParsed.data.value,
          bodyParsed.data.scope
        );

        const data = ZPluginApiStorageRecord.parse(record);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.set',
          resource: `${namespace}:${key}`,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti, scope: bodyParsed.data.scope }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.set',
          resource: `${namespace}:${key}`,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to save plugin storage record');
      }
    }
  )
  .delete(
    '/:namespace/:key',
    describePluginApiRoute({
      operationId: 'pluginStorageDelete',
      summary: 'Delete a namespaced plugin storage record',
      scope: 'plugin.storage:write'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const namespace = c.req.param('namespace');
      const key = c.req.param('key');

      if (!claims.scopes.includes('plugin.storage:write')) {
        return handlePluginApiError(
          c,
          new AppError('Permission plugin.storage:write is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryParsed = ZScopeQuery.safeParse(c.req.query());
        if (!queryParsed.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const scope = queryParsed.data.scope;
        const deleted = await deleteStorageValue(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          namespace,
          key,
          scope
        );

        const data = { deleted };

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.delete',
          resource: `${namespace}:${key}`,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti, scope }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.storage.delete',
          resource: `${namespace}:${key}`,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to delete plugin storage record');
      }
    }
  );
