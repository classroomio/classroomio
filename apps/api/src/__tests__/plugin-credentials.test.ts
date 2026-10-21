import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  createPluginCredential: vi.fn(),
  getInstallationById: vi.fn(),
  listInstallationCredentials: vi.fn(),
  recordPluginAuditEvent: vi.fn(),
  revokePluginCredential: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => ({
  createPluginCredential: dbMocks.createPluginCredential,
  getInstallationById: dbMocks.getInstallationById,
  listInstallationCredentials: dbMocks.listInstallationCredentials,
  recordPluginAuditEvent: dbMocks.recordPluginAuditEvent,
  revokePluginCredential: dbMocks.revokePluginCredential
}));

import { createCredential, listCredentials, revokeCredential } from '@api/services/plugin/credentials';

describe('Plugin Credentials Service', () => {
  const installation = {
    id: 'inst-123',
    organizationId: 'org-456',
    pluginId: 'com.example.test-plugin',
    ownerType: 'organization',
    status: 'active'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a new raw secret with prefix, hashes secret, and logs audit', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(installation);
    dbMocks.createPluginCredential.mockImplementationOnce((data) => ({
      id: 'cred-1',
      ...data,
      status: 'active',
      createdAt: '2026-10-09T00:00:00Z',
      revokedAt: null
    }));

    const result = await createCredential('inst-123', 'org-456', 'Production Key', 30, 'user-admin');

    expect(result.secret).toMatch(/^cio_sec_/);
    expect(result.credential.secretPrefix).toBe(result.secret.slice(0, 16));
    expect(result.credential.secretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.credential.expiresAt).toBeDefined();

    expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: 'inst-123',
        organizationId: 'org-456',
        action: 'plugin.credential_created',
        outcome: 'success'
      })
    );
  });

  it('throws 404 if installation is not found during credential creation', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(null);

    await expect(createCredential('inst-unknown', 'org-456')).rejects.toThrow('Plugin installation not found');
  });

  it('revokes credential and writes audit entry', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce(installation);
    dbMocks.revokePluginCredential.mockResolvedValueOnce({
      id: 'cred-1',
      installationId: 'inst-123',
      secretPrefix: 'cio_sec_123',
      secretHash: 'hash123',
      createdAt: '2026-10-09T00:00:00Z',
      label: null,
      expiresAt: null,
      revokedAt: '2026-10-09T01:00:00Z'
    });

    const revoked = await revokeCredential('inst-123', 'org-456', 'cred-1', 'user-admin');

    expect(revoked.revokedAt).toBe('2026-10-09T01:00:00Z');
    expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: 'inst-123',
        action: 'plugin.credential_revoked',
        outcome: 'success'
      })
    );
  });
});
