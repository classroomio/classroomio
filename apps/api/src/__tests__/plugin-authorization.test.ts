import { beforeEach, describe, expect, it, vi } from 'vitest';

const getInstallationById = vi.hoisted(() => vi.fn());
const getInstallationGrants = vi.hoisted(() => vi.fn());
const getPluginById = vi.hoisted(() => vi.fn());
const getPluginVersionById = vi.hoisted(() => vi.fn());
const getUserOrgRole = vi.hoisted(() => vi.fn());

vi.mock('@cio/db/queries', () => ({
  getInstallationById,
  getInstallationGrants,
  getPluginById,
  getPluginVersionById,
  getUserOrgRole
}));

import { authorizePluginRequest, requireOrganizationInstallation } from '@api/services/plugin/authorization';

describe('requireOrganizationInstallation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInstallationGrants.mockResolvedValue([]);
    getUserOrgRole.mockResolvedValue(1);
    getPluginById.mockResolvedValue({ id: 'test-plugin', status: 'published' });
    getPluginVersionById.mockResolvedValue({ id: 'test-version', reviewStatus: 'approved' });
  });

  it('returns an organization installation only to its owning tenant', async () => {
    const installation = {
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    };
    getInstallationById.mockResolvedValue(installation);

    await expect(requireOrganizationInstallation(installation.id, installation.organizationId)).resolves.toBe(
      installation
    );
  });

  it('returns the same not-found result for a cross-tenant IDOR attempt', async () => {
    getInstallationById.mockResolvedValue({
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    });

    await expect(
      requireOrganizationInstallation('90d329c9-df43-416c-a8b6-1a739d2be966', '2194bd50-7590-41e3-b381-917dc347176f')
    ).rejects.toMatchObject({ code: 'INSTALLATION_NOT_FOUND', statusCode: 404 });
  });

  it('does not expose user-owned installations through organization routes', async () => {
    getInstallationById.mockResolvedValue({
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      ownerType: 'user',
      organizationId: null,
      status: 'active',
      orgApprovalStatus: 'approved'
    });

    await expect(
      requireOrganizationInstallation('90d329c9-df43-416c-a8b6-1a739d2be966', '2194bd50-7590-41e3-b381-917dc347176f')
    ).rejects.toMatchObject({ code: 'INSTALLATION_NOT_FOUND', statusCode: 404 });
  });

  it('intersects live grants, token scopes, and the actor role', async () => {
    const installation = {
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    };
    getInstallationById.mockResolvedValue(installation);
    getInstallationGrants.mockResolvedValue([{ scope: 'certificate.template:write' }]);
    getUserOrgRole.mockResolvedValue(2);

    await expect(
      authorizePluginRequest({
        installationId: installation.id,
        organizationId: installation.organizationId,
        actorId: '2194bd50-7590-41e3-b381-917dc347176f',
        requiredScope: 'certificate.template:write',
        tokenScopes: ['certificate.template:write'],
        allowedRoles: ['admin', 'tutor']
      })
    ).resolves.toMatchObject({ organizationRole: 'tutor' });

    getUserOrgRole.mockResolvedValue(3);
    await expect(
      authorizePluginRequest({
        installationId: installation.id,
        organizationId: installation.organizationId,
        actorId: '2194bd50-7590-41e3-b381-917dc347176f',
        requiredScope: 'certificate.template:write',
        tokenScopes: ['certificate.template:write'],
        allowedRoles: ['admin', 'tutor']
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('denies revoked grants and stale token scopes immediately', async () => {
    getInstallationById.mockResolvedValue({
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    getInstallationGrants.mockResolvedValue([]);

    await expect(
      authorizePluginRequest({
        installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
        organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
        requiredScope: 'course.metadata:read',
        tokenScopes: ['course.metadata:read']
      })
    ).rejects.toMatchObject({ code: 'PLUGIN_PERMISSION_DENIED', statusCode: 403 });

    getInstallationGrants.mockResolvedValue([{ scope: 'course.metadata:read' }]);
    await expect(
      authorizePluginRequest({
        installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
        organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
        requiredScope: 'course.metadata:read',
        tokenScopes: []
      })
    ).rejects.toMatchObject({ code: 'PLUGIN_PERMISSION_DENIED', statusCode: 403 });
  });

  it('enforces contribution surface and exact host-bound resources', async () => {
    getInstallationById.mockResolvedValue({
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    getInstallationGrants.mockResolvedValue([{ scope: 'certificate.template:read' }]);

    const authorization = {
      installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      requiredScope: 'certificate.template:read' as const,
      contributionTarget: 'certificate.templates',
      allowedContributionTargets: ['certificate.templates'],
      boundResource: { type: 'course' as const, id: 'e69a0319-9404-4b53-a3d5-1f953047a06d' },
      requestedResource: { type: 'course' as const, id: 'f1406f0e-3676-4d05-b384-368798bf2df7' },
      requireBoundResource: true
    };

    await expect(authorizePluginRequest(authorization)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403
    });
  });

  it('rejects authorization when the plugin has been revoked', async () => {
    getInstallationById.mockResolvedValue({
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      pluginId: 'test-plugin',
      pluginVersionId: 'test-version',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    getPluginById.mockResolvedValue({ id: 'test-plugin', status: 'revoked' });

    await expect(
      authorizePluginRequest({
        installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
        organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0'
      })
    ).rejects.toMatchObject({
      code: 'PLUGIN_REVOKED',
      statusCode: 403
    });
  });

  it('rejects authorization when the plugin version is not approved', async () => {
    getInstallationById.mockResolvedValue({
      id: '90d329c9-df43-416c-a8b6-1a739d2be966',
      pluginId: 'test-plugin',
      pluginVersionId: 'test-version',
      ownerType: 'organization',
      organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    getPluginById.mockResolvedValue({ id: 'test-plugin', status: 'published' });
    getPluginVersionById.mockResolvedValue({ id: 'test-version', reviewStatus: 'pending' });

    await expect(
      authorizePluginRequest({
        installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
        organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0'
      })
    ).rejects.toMatchObject({
      code: 'PLUGIN_VERSION_NOT_APPROVED',
      statusCode: 403
    });
  });
});
