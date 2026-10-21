import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getUserOrgRole: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@cio/db/queries', () => dbMocks);

import { createPluginApiAccessToken, verifyPluginApiAccessToken } from '@api/services/plugin/access-token';

describe('plugin API access tokens', () => {
  const launchClaims = {
    pluginId: 'com.classroomio.certificate-studio',
    versionId: '747b1324-b281-43d3-b468-032727fe5819',
    installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
    organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
    userId: '2194bd50-7590-41e3-b381-917dc347176f',
    organizationRole: 'admin' as const,
    contributionTarget: 'plugin.page' as const,
    resource: null,
    audience: 'https://certificate-studio.services.classroomio.com',
    grantedScopes: ['organization.profile:read', 'certificate.template:read'],
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue({
      id: launchClaims.installationId,
      pluginId: launchClaims.pluginId,
      pluginVersionId: launchClaims.versionId,
      ownerType: 'organization',
      organizationId: launchClaims.organizationId,
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'organization.profile:read' },
      { scope: 'certificate.template:read' }
    ]);
    dbMocks.getUserOrgRole.mockResolvedValue(1);
    dbMocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  it('issues an audience-bound token and revalidates tenant, actor, and current grants', async () => {
    const issued = createPluginApiAccessToken(launchClaims);
    const claims = await verifyPluginApiAccessToken(issued.accessToken);

    expect(claims).toMatchObject({
      aud: 'classroomio:plugin-api:v1',
      clientAudience: launchClaims.audience,
      installationId: launchClaims.installationId,
      organizationId: launchClaims.organizationId,
      scopes: launchClaims.grantedScopes
    });
  });

  it('rejects tampering and takes installation revocation effect immediately', async () => {
    const issued = createPluginApiAccessToken(launchClaims);
    const tamperedToken = `${issued.accessToken.slice(0, -1)}x`;

    await expect(verifyPluginApiAccessToken(tamperedToken)).rejects.toMatchObject({ statusCode: 401 });

    dbMocks.getInstallationById.mockResolvedValue({
      id: launchClaims.installationId,
      pluginId: launchClaims.pluginId,
      pluginVersionId: launchClaims.versionId,
      ownerType: 'organization',
      organizationId: launchClaims.organizationId,
      status: 'disabled',
      orgApprovalStatus: 'approved'
    });

    await expect(verifyPluginApiAccessToken(issued.accessToken)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('removes scopes that were revoked after token issuance', async () => {
    dbMocks.getInstallationGrants.mockResolvedValue([{ scope: 'certificate.template:read' }]);
    const issued = createPluginApiAccessToken(launchClaims);
    const claims = await verifyPluginApiAccessToken(issued.accessToken);

    expect(claims.scopes).toEqual(['certificate.template:read']);
  });
});
