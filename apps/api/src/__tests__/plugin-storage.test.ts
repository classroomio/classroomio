import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  deletePluginStorageItem: vi.fn(),
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getPluginStorageItem: vi.fn(),
  getPluginStorageUsageBytes: vi.fn(),
  getPluginVersionById: vi.fn(),
  getUserOrgRole: vi.fn(),
  listPluginStorageByNamespace: vi.fn(),
  setPluginStorageItem: vi.fn()
}));

vi.mock('@cio/db/queries', () => dbMocks);

import {
  deleteStorageValue,
  getStorageRecord,
  getStorageValue,
  listStorageRecords,
  setStorageValue
} from '@api/services/plugin/storage';

describe('plugin storage service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue({
      id: 'installation-1',
      organizationId: 'organization-1',
      userId: null,
      ownerType: 'organization',
      status: 'active',
      orgApprovalStatus: 'approved',
      pluginVersionId: 'version-1'
    });
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'plugin.storage:read' },
      { scope: 'plugin.storage:write' }
    ]);
    dbMocks.getPluginStorageUsageBytes.mockResolvedValue(0);
    dbMocks.getUserOrgRole.mockResolvedValue(1);
    dbMocks.getPluginVersionById.mockResolvedValue({
      id: 'version-1',
      manifest: {
        manifestVersion: 1,
        id: 'com.example.storage-test',
        name: 'Storage test',
        version: '1.0.0',
        description: 'A plugin manifest for storage service tests.',
        publisher: 'Example',
        engines: { classroomio: '>=1.0.0', pluginApi: '1.0.0' },
        permissions: { required: ['plugin.storage:read', 'plugin.storage:write'] },
        storage: {
          documents: [
            { namespace: 'announcement', scope: 'organization', schemaVersion: 1, schema: {} },
            { namespace: 'announcement', scope: 'user', schemaVersion: 1, schema: {} },
            { namespace: 'settings', scope: 'organization', schemaVersion: 1, schema: {} }
          ]
        },
        dataPolicy: { storesCustomerData: false }
      }
    });
  });

  it('isolates user-scoped values by the authenticated user', async () => {
    dbMocks.getPluginStorageItem.mockResolvedValue({ value: true });

    await expect(
      getStorageValue('installation-1', 'organization-1', 'user-1', 'announcement', 'dismissed-1', 'user')
    ).resolves.toBe(true);
    expect(dbMocks.getPluginStorageItem).toHaveBeenCalledWith(
      'installation-1',
      'user',
      'user-1',
      'announcement',
      'dismissed-1'
    );
  });

  it('gets organization-owned values for an authorized installation', async () => {
    dbMocks.getPluginStorageItem.mockResolvedValue({ value: { wpm: 250 } });

    await expect(
      getStorageValue('installation-1', 'organization-1', 'user-1', 'settings', 'wpm', 'owner')
    ).resolves.toEqual({ wpm: 250 });
    expect(dbMocks.getPluginStorageItem).toHaveBeenCalledWith(
      'installation-1',
      'organization',
      'organization-1',
      'settings',
      'wpm'
    );
  });

  it('rejects disabled, unapproved, or cross-organization access', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce({
      id: 'installation-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'disabled',
      orgApprovalStatus: 'approved'
    });

    await expect(
      getStorageValue('installation-1', 'organization-1', 'user-1', 'settings', 'wpm', 'owner')
    ).rejects.toMatchObject({ code: 'INSTALLATION_NOT_ACTIVE', statusCode: 403 });

    dbMocks.getInstallationById.mockResolvedValueOnce({
      id: 'installation-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'active',
      orgApprovalStatus: 'approved'
    });

    await expect(
      getStorageValue('installation-1', 'organization-2', 'user-1', 'settings', 'wpm', 'owner')
    ).rejects.toMatchObject({ code: 'INSTALLATION_NOT_FOUND', statusCode: 404 });
  });

  it('requires the declared storage permission', async () => {
    dbMocks.getInstallationGrants.mockResolvedValue([]);

    await expect(
      getStorageValue('installation-1', 'organization-1', 'user-1', 'settings', 'wpm', 'owner')
    ).rejects.toMatchObject({ code: 'PLUGIN_PERMISSION_DENIED', statusCode: 403 });
  });

  it('requires the namespace and scope to be declared in the installed manifest', async () => {
    await expect(
      getStorageValue('installation-1', 'organization-1', 'user-1', 'undeclared', 'value', 'organization')
    ).rejects.toMatchObject({ code: 'PLUGIN_STORAGE_SCHEMA_NOT_DECLARED', statusCode: 403 });
  });

  it('allows members to write their user scope but not organization-owned settings', async () => {
    dbMocks.getUserOrgRole.mockResolvedValue(2);

    await expect(
      setStorageValue('installation-1', 'organization-1', 'user-1', 'announcement', 'dismissed-1', true, 'user')
    ).resolves.toEqual({
      namespace: 'announcement',
      key: 'dismissed-1',
      value: true,
      scope: 'user'
    });

    await expect(
      setStorageValue(
        'installation-1',
        'organization-1',
        'user-1',
        'announcement',
        'config',
        { message: 'Changed' },
        'owner'
      )
    ).rejects.toMatchObject({ code: 'PLUGIN_STORAGE_ADMIN_REQUIRED', statusCode: 403 });
  });

  it('allows an organization admin to update owner-scoped settings', async () => {
    await expect(
      setStorageValue(
        'installation-1',
        'organization-1',
        'admin-1',
        'announcement',
        'config',
        { message: 'Changed' },
        'owner'
      )
    ).resolves.toEqual({
      namespace: 'announcement',
      key: 'config',
      value: { message: 'Changed' },
      scope: 'organization'
    });

    expect(dbMocks.setPluginStorageItem).toHaveBeenCalledWith(
      expect.objectContaining({ scopeType: 'organization', scopeId: 'organization-1' })
    );
  });

  it('rejects storage items exceeding the 256 KiB limit', async () => {
    const oversizedPayload = { data: 'a'.repeat(300 * 1024) };

    await expect(
      setStorageValue('installation-1', 'organization-1', 'admin-1', 'settings', 'oversized', oversizedPayload, 'owner')
    ).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE', statusCode: 413 });
    expect(dbMocks.setPluginStorageItem).not.toHaveBeenCalled();
  });

  it('enforces the per-installation storage quota', async () => {
    dbMocks.getPluginStorageUsageBytes.mockResolvedValue(5 * 1024 * 1024);

    await expect(
      setStorageValue('installation-1', 'organization-1', 'admin-1', 'settings', 'theme', 'dark', 'owner')
    ).rejects.toMatchObject({ code: 'PLUGIN_STORAGE_QUOTA_EXCEEDED', statusCode: 413 });
    expect(dbMocks.setPluginStorageItem).not.toHaveBeenCalled();
  });

  it('rejects invalid or oversized keys', async () => {
    const longKey = 'k'.repeat(150);

    await expect(
      setStorageValue('installation-1', 'organization-1', 'admin-1', 'settings', longKey, 'value', 'owner')
    ).rejects.toMatchObject({ code: 'INVALID_STORAGE_KEY', statusCode: 400 });
  });

  it('gets a storage record with metadata or null when absent', async () => {
    dbMocks.getPluginStorageItem.mockResolvedValueOnce({
      namespace: 'settings',
      key: 'theme',
      value: 'dark',
      scopeType: 'organization',
      updatedAt: '2026-10-10T12:00:00Z'
    });

    const record = await getStorageRecord(
      'installation-1',
      'organization-1',
      'user-1',
      'settings',
      'theme',
      'organization'
    );
    expect(record).toEqual({
      namespace: 'settings',
      key: 'theme',
      value: 'dark',
      scope: 'organization',
      updatedAt: '2026-10-10T12:00:00Z'
    });

    dbMocks.getPluginStorageItem.mockResolvedValueOnce(null);
    const absent = await getStorageRecord(
      'installation-1',
      'organization-1',
      'user-1',
      'settings',
      'missing',
      'organization'
    );
    expect(absent).toBeNull();
  });

  it('lists storage records in a namespace', async () => {
    dbMocks.listPluginStorageByNamespace.mockResolvedValueOnce([
      {
        namespace: 'settings',
        key: 'theme',
        value: 'dark',
        scopeType: 'organization',
        updatedAt: '2026-10-10T12:00:00Z'
      },
      {
        namespace: 'settings',
        key: 'fontSize',
        value: 14,
        scopeType: 'organization',
        updatedAt: '2026-10-10T12:00:00Z'
      }
    ]);

    const items = await listStorageRecords('installation-1', 'organization-1', 'user-1', 'settings', 'organization');
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      namespace: 'settings',
      key: 'theme',
      value: 'dark',
      scope: 'organization',
      updatedAt: '2026-10-10T12:00:00Z'
    });
  });

  it('deletes a user-scoped value without affecting another user', async () => {
    dbMocks.deletePluginStorageItem.mockResolvedValue(true);

    await expect(
      deleteStorageValue('installation-1', 'organization-1', 'user-1', 'announcement', 'dismissed-1', 'user')
    ).resolves.toBe(true);
    expect(dbMocks.deletePluginStorageItem).toHaveBeenCalledWith(
      'installation-1',
      'user',
      'user-1',
      'announcement',
      'dismissed-1'
    );
  });
});
