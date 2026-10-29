import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getPluginById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getPluginStorageItem: vi.fn(),
  setPluginStorageItem: vi.fn(),
  setPluginStorageItemWithAtomicQuota: vi.fn(),
  deletePluginStorageItem: vi.fn(),
  listPluginStorageByNamespace: vi.fn(),
  getPluginStorageUsageBytes: vi.fn(),
  verifyResourceOrganization: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => dbMocks);

import {
  deleteStorageValue,
  getStorageValue,
  listStorageRecords,
  resolveStorageScope,
  setStorageValue
} from '@api/services/plugin/storage';

describe('Plugin Generic Storage Service', () => {
  const installationId = '11111111-1111-4111-8111-111111111111';
  const organizationId = '22222222-2222-4222-8222-222222222222';
  const userId = '33333333-3333-4333-8333-333333333333';

  const mockInstallation = {
    id: installationId,
    ownerType: 'organization',
    organizationId,
    pluginId: 'com.example.plugin',
    status: 'active',
    orgApprovalStatus: 'approved'
  };

  const mockPlugin = {
    id: 'com.example.plugin',
    status: 'active'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue({ ...mockInstallation });
    dbMocks.getPluginById.mockResolvedValue({ ...mockPlugin });
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'plugin.storage:read' },
      { scope: 'plugin.storage:write' }
    ]);
    dbMocks.verifyResourceOrganization.mockResolvedValue(true);
  });

  it('resolves storage scopes correctly', () => {
    expect(resolveStorageScope('user', userId, organizationId)).toEqual({
      scopeType: 'user',
      scopeId: userId,
      resourceType: ''
    });
    expect(resolveStorageScope('organization', userId, organizationId)).toEqual({
      scopeType: 'organization',
      scopeId: organizationId,
      resourceType: ''
    });
    expect(resolveStorageScope(undefined, userId, organizationId)).toEqual({
      scopeType: 'organization',
      scopeId: organizationId,
      resourceType: ''
    });
  });

  it('rejects access if installation is inactive or unapproved', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce({
      ...mockInstallation,
      status: 'disabled'
    });

    await expect(getStorageValue(installationId, organizationId, userId, 'config', 'settings')).rejects.toThrow(
      'Plugin installation is not active'
    );

    dbMocks.getInstallationById.mockResolvedValueOnce({
      ...mockInstallation,
      orgApprovalStatus: 'pending'
    });

    await expect(getStorageValue(installationId, organizationId, userId, 'config', 'settings')).rejects.toThrow(
      'Plugin installation is not approved for this organization'
    );
  });

  it('rejects access if plugin lacks storage permissions', async () => {
    dbMocks.getInstallationGrants.mockResolvedValueOnce([]);

    await expect(getStorageValue(installationId, organizationId, userId, 'config', 'settings')).rejects.toThrow(
      'Plugin lacks storage read permission'
    );

    dbMocks.getInstallationGrants.mockResolvedValueOnce([]);

    await expect(
      setStorageValue(
        installationId,
        organizationId,
        userId,
        'config',
        'settings',
        { enabled: true },
        'organization',
        1
      )
    ).rejects.toThrow('Plugin lacks storage write permission');
  });

  it('rejects organization scope writes by learners (role 3)', async () => {
    await expect(
      setStorageValue(
        installationId,
        organizationId,
        userId,
        'config',
        'settings',
        { enabled: true },
        'organization',
        3
      )
    ).rejects.toThrow('Only organization admins and tutors can modify organization- or resource-scoped storage');

    await expect(
      deleteStorageValue(installationId, organizationId, userId, 'config', 'settings', 'organization', 3)
    ).rejects.toThrow('Only organization admins and tutors can modify organization- or resource-scoped storage');
  });

  it('rejects resource scope writes by learners (role 3)', async () => {
    await expect(
      setStorageValue(
        installationId,
        organizationId,
        userId,
        'config',
        'settings',
        { enabled: true },
        'resource',
        3,
        'course',
        '44444444-4444-4444-8444-444444444444'
      )
    ).rejects.toThrow('Only organization admins and tutors can modify organization- or resource-scoped storage');
  });

  it('rejects resources outside the organization', async () => {
    dbMocks.verifyResourceOrganization.mockResolvedValueOnce(false);

    await expect(
      getStorageValue(
        installationId,
        organizationId,
        userId,
        'config',
        'settings',
        'resource',
        1,
        'course',
        '44444444-4444-4444-8444-444444444444'
      )
    ).rejects.toThrow('Resource does not belong to the organization');
  });

  it('allows learners (role 3) to write user-scoped storage', async () => {
    dbMocks.setPluginStorageItemWithAtomicQuota.mockResolvedValueOnce({
      id: 'storage-1',
      installationId,
      scopeType: 'user',
      scopeId: userId,
      namespace: 'announcement',
      key: 'dismissed-1',
      value: { dismissed: true }
    });

    const result = await setStorageValue(
      installationId,
      organizationId,
      userId,
      'announcement',
      'dismissed-1',
      { dismissed: true },
      'user',
      3
    );

    expect(result).toEqual({ success: true });
    expect(dbMocks.setPluginStorageItemWithAtomicQuota).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId,
        scopeType: 'user',
        scopeId: userId,
        namespace: 'announcement',
        key: 'dismissed-1',
        value: { dismissed: true }
      }),
      5 * 1024 * 1024,
      expect.any(Number)
    );
  });

  it('fetches existing storage item', async () => {
    dbMocks.getPluginStorageItem.mockResolvedValueOnce({
      id: 'storage-1',
      installationId,
      scopeType: 'organization',
      scopeId: organizationId,
      namespace: 'config',
      key: 'settings',
      value: { theme: 'dark' }
    });

    const result = await getStorageValue(installationId, organizationId, userId, 'config', 'settings');
    expect(result).toEqual({ theme: 'dark' });
    expect(dbMocks.getPluginStorageItem).toHaveBeenCalledWith(
      installationId,
      'organization',
      organizationId,
      'config',
      'settings',
      ''
    );
  });

  it('returns null when item does not exist', async () => {
    dbMocks.getPluginStorageItem.mockResolvedValueOnce(null);

    const result = await getStorageValue(installationId, organizationId, userId, 'config', 'missing');
    expect(result).toBeNull();
  });

  it('stores item within size quota atomically', async () => {
    dbMocks.setPluginStorageItemWithAtomicQuota.mockResolvedValueOnce({
      id: 'storage-1',
      installationId,
      scopeType: 'organization',
      scopeId: organizationId,
      namespace: 'config',
      key: 'settings',
      value: { enabled: true }
    });

    const result = await setStorageValue(
      installationId,
      organizationId,
      userId,
      'config',
      'settings',
      { enabled: true },
      'organization',
      1
    );

    expect(result).toEqual({ success: true });
    expect(dbMocks.setPluginStorageItemWithAtomicQuota).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId,
        scopeType: 'organization',
        scopeId: organizationId,
        namespace: 'config',
        key: 'settings',
        value: { enabled: true }
      }),
      5 * 1024 * 1024,
      expect.any(Number)
    );
  });

  it('rejects items exceeding single item size limit (256KB)', async () => {
    const hugePayload = { data: 'x'.repeat(260 * 1024) };

    await expect(
      setStorageValue(installationId, organizationId, userId, 'default', 'big', hugePayload, 'organization', 1)
    ).rejects.toThrow('Storage item exceeds maximum allowed size');
  });

  it('rejects items when atomic quota is exceeded', async () => {
    dbMocks.setPluginStorageItemWithAtomicQuota.mockRejectedValueOnce(new Error('STORAGE_QUOTA_EXCEEDED'));

    await expect(
      setStorageValue(installationId, organizationId, userId, 'default', 'item', { test: true }, 'organization', 1)
    ).rejects.toThrow('Installation storage quota exceeded');
  });

  it('deletes storage item', async () => {
    dbMocks.deletePluginStorageItem.mockResolvedValueOnce(true);

    const result = await deleteStorageValue(
      installationId,
      organizationId,
      userId,
      'config',
      'settings',
      'organization',
      1
    );
    expect(result).toEqual({ success: true, deleted: true });
    expect(dbMocks.deletePluginStorageItem).toHaveBeenCalledWith(
      installationId,
      'organization',
      organizationId,
      'config',
      'settings',
      ''
    );
  });

  it('lists records in a namespace', async () => {
    const updatedAt = new Date().toISOString();
    dbMocks.listPluginStorageByNamespace.mockResolvedValueOnce([
      { key: 'key1', value: 'val1', updatedAt },
      { key: 'key2', value: 'val2', updatedAt }
    ]);

    const records = await listStorageRecords(installationId, organizationId, userId, 'templates');
    expect(records).toEqual([
      { key: 'key1', value: 'val1', updatedAt },
      { key: 'key2', value: 'val2', updatedAt }
    ]);
  });
});
