import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  deletePluginStorageItem: vi.fn(),
  getInstallationById: vi.fn(),
  getPluginStorageItem: vi.fn(),
  setPluginStorageItem: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => ({
  deletePluginStorageItem: dbMocks.deletePluginStorageItem,
  getInstallationById: dbMocks.getInstallationById,
  getPluginStorageItem: dbMocks.getPluginStorageItem,
  setPluginStorageItem: dbMocks.setPluginStorageItem
}));

import { deleteStorageValue, getStorageValue, setStorageValue } from '@api/services/plugin/storage';

describe('Plugin Namespaced Storage Service', () => {
  const activeOrgInstallation = {
    id: 'inst-100',
    ownerType: 'organization',
    organizationId: 'org-200',
    userId: null,
    pluginId: 'com.example.reading-time',
    status: 'active'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets a stored value for an active installation', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(activeOrgInstallation);
    dbMocks.getPluginStorageItem.mockResolvedValueOnce({
      value: { wpm: 250 }
    });

    const result = await getStorageValue('inst-100', 'settings', 'wpm');

    expect(result).toEqual({ wpm: 250 });
    expect(dbMocks.getPluginStorageItem).toHaveBeenCalledWith('inst-100', 'organization', 'org-200', 'settings', 'wpm');
  });

  it('rejects storage access if installation is disabled or revoked', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce({
      ...activeOrgInstallation,
      status: 'disabled'
    });

    await expect(getStorageValue('inst-100', 'settings', 'wpm')).rejects.toThrow('Plugin installation is not active');
  });

  it('sets a storage value within the 256 KiB quota', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(activeOrgInstallation);
    dbMocks.setPluginStorageItem.mockResolvedValueOnce({
      id: 'store-1'
    });

    await setStorageValue('inst-100', 'settings', 'config', { speed: 200 });

    expect(dbMocks.setPluginStorageItem).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: 'inst-100',
        scopeType: 'organization',
        scopeId: 'org-200',
        namespace: 'settings',
        key: 'config',
        value: { speed: 200 }
      })
    );
  });

  it('rejects storage items exceeding the 256 KiB limit', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(activeOrgInstallation);

    const oversizedPayload = { data: 'a'.repeat(300 * 1024) };

    await expect(setStorageValue('inst-100', 'settings', 'oversized', oversizedPayload)).rejects.toThrow(
      'Storage item exceeds maximum limit of 256 KiB'
    );

    expect(dbMocks.setPluginStorageItem).not.toHaveBeenCalled();
  });

  it('rejects invalid or oversized keys', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(activeOrgInstallation);

    const longKey = 'k'.repeat(150);

    await expect(setStorageValue('inst-100', 'settings', longKey, 'val')).rejects.toThrow(
      'Storage key must be between 1 and 128 characters'
    );
  });

  it('deletes a stored value', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(activeOrgInstallation);
    dbMocks.deletePluginStorageItem.mockResolvedValueOnce(true);

    const deleted = await deleteStorageValue('inst-100', 'settings', 'wpm');

    expect(deleted).toBe(true);
    expect(dbMocks.deletePluginStorageItem).toHaveBeenCalledWith(
      'inst-100',
      'organization',
      'org-200',
      'settings',
      'wpm'
    );
  });
});
