import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  getStorageRecord: vi.fn(),
  listStorageRecords: vi.fn(),
  setStorageValue: vi.fn(),
  deleteStorageValue: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/storage', () => ({
  getStorageRecord: mocks.getStorageRecord,
  listStorageRecords: mocks.listStorageRecords,
  setStorageValue: mocks.setStorageValue,
  deleteStorageValue: mocks.deleteStorageValue
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('plugin API storage routes', () => {
  const adminClaims = {
    iss: 'classroomio' as const,
    aud: 'classroomio:plugin-api:v1' as const,
    sub: '2194bd50-7590-41e3-b381-917dc347176f',
    jti: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50',
    iat: 1,
    exp: 4_000_000_000,
    pluginId: 'com.classroomio.reading-time',
    installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
    organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
    organizationRole: 'admin' as const,
    contributionTarget: 'plugin.page' as const,
    resource: null,
    clientAudience: 'https://plugins.classroomio.com',
    scopes: ['plugin.storage:read', 'plugin.storage:write']
  };

  const studentClaims = {
    ...adminClaims,
    sub: 'a1111111-2222-3333-4444-555555555555',
    organizationRole: 'student' as const
  };

  const sampleRecord = {
    namespace: 'settings',
    key: 'theme',
    value: { mode: 'dark' },
    scope: 'organization' as const,
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(adminClaims);
    mocks.getStorageRecord.mockResolvedValue(sampleRecord);
    mocks.listStorageRecords.mockResolvedValue([sampleRecord]);
    mocks.setStorageValue.mockResolvedValue(sampleRecord);
    mocks.deleteStorageValue.mockResolvedValue(true);
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  describe('GET /v1/storage/:namespace/:key', () => {
    it('returns a storage record for the requested key', async () => {
      const response = await pluginApiRouter.request('/v1/storage/settings/theme?scope=organization', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleRecord,
        requestId: expect.any(String)
      });
      expect(mocks.getStorageRecord).toHaveBeenCalledWith(
        adminClaims.installationId,
        adminClaims.organizationId,
        adminClaims.sub,
        'settings',
        'theme',
        'organization'
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.storage.get',
          outcome: 'success',
          resource: 'settings:theme'
        })
      );
    });

    it('returns 404 when key is not found', async () => {
      mocks.getStorageRecord.mockResolvedValue(null);

      const response = await pluginApiRouter.request('/v1/storage/settings/missing', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.storage.get',
          outcome: 'denied',
          resource: 'settings:missing'
        })
      );
    });

    it('requires plugin.storage:read scope', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...adminClaims,
        scopes: ['plugin.storage:write']
      });

      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getStorageRecord).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/storage/:namespace', () => {
    it('lists storage records in a namespace', async () => {
      const response = await pluginApiRouter.request('/v1/storage/settings?scope=organization', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: { items: [sampleRecord] },
        requestId: expect.any(String)
      });
      expect(mocks.listStorageRecords).toHaveBeenCalledWith(
        adminClaims.installationId,
        adminClaims.organizationId,
        adminClaims.sub,
        'settings',
        'organization'
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.storage.list',
          outcome: 'success',
          resource: 'settings'
        })
      );
    });

    it('requires plugin.storage:read scope', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...adminClaims,
        scopes: []
      });

      const response = await pluginApiRouter.request('/v1/storage/settings', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listStorageRecords).not.toHaveBeenCalled();
    });
  });

  describe('PUT /v1/storage/:namespace/:key', () => {
    it('saves storage record when authorized as admin', async () => {
      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ value: { mode: 'dark' }, scope: 'organization' })
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleRecord,
        requestId: expect.any(String)
      });
      expect(mocks.setStorageValue).toHaveBeenCalledWith(
        adminClaims.installationId,
        adminClaims.organizationId,
        adminClaims.sub,
        'settings',
        'theme',
        { mode: 'dark' },
        'organization',
        true
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.storage.set',
          outcome: 'success',
          resource: 'settings:theme'
        })
      );
    });

    it('rejects organization scope update when actor is not admin', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue(studentClaims);
      mocks.setStorageValue.mockRejectedValue(
        new AppError('Only organization admins can update plugin settings', 'PLUGIN_STORAGE_ADMIN_REQUIRED', 403)
      );

      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ value: { mode: 'dark' }, scope: 'organization' })
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.setStorageValue).toHaveBeenCalledWith(
        studentClaims.installationId,
        studentClaims.organizationId,
        studentClaims.sub,
        'settings',
        'theme',
        { mode: 'dark' },
        'organization',
        false
      );
    });

    it('requires plugin.storage:write scope', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...adminClaims,
        scopes: ['plugin.storage:read']
      });

      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ value: { mode: 'dark' } })
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.setStorageValue).not.toHaveBeenCalled();
    });

    it('handles payload too large error', async () => {
      mocks.setStorageValue.mockRejectedValue(
        new AppError('Storage item exceeds maximum limit of 256 KiB', 'PAYLOAD_TOO_LARGE', 413)
      );

      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ value: { huge: 'payload' } })
      });
      const body = await response.json();

      expect(response.status).toBe(413);
      expect(body.error.code).toBe('payload_too_large');
    });

    it('rejects an oversized HTTP body before parsing or calling storage', async () => {
      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ value: 'x'.repeat(257 * 1024) })
      });
      const body = await response.json();

      expect(response.status).toBe(413);
      expect(body.error.code).toBe('payload_too_large');
      expect(mocks.setStorageValue).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /v1/storage/:namespace/:key', () => {
    it('deletes storage record successfully', async () => {
      const response = await pluginApiRouter.request('/v1/storage/settings/theme?scope=organization', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: { deleted: true },
        requestId: expect.any(String)
      });
      expect(mocks.deleteStorageValue).toHaveBeenCalledWith(
        adminClaims.installationId,
        adminClaims.organizationId,
        adminClaims.sub,
        'settings',
        'theme',
        'organization',
        true
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.storage.delete',
          outcome: 'success',
          resource: 'settings:theme'
        })
      );
    });

    it('requires plugin.storage:write scope', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...adminClaims,
        scopes: ['plugin.storage:read']
      });

      const response = await pluginApiRouter.request('/v1/storage/settings/theme', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.deleteStorageValue).not.toHaveBeenCalled();
    });
  });
});
