import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { TPluginManifest } from '@cio/utils/validation/plugin';

const dbMocks = vi.hoisted(() => ({
  createInstallation: vi.fn(),
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getOrganizationInstallation: vi.fn(),
  getPluginById: vi.fn(),
  getPluginByIdOrSlug: vi.fn(),
  getPluginVersion: vi.fn(),
  getPluginVersionById: vi.fn(),
  getUserInstallation: vi.fn(),
  listOrganizationInstallations: vi.fn(),
  listPluginVersions: vi.fn(),
  recordPluginAuditEvent: vi.fn(),
  reinstallInstallation: vi.fn(),
  replaceInstallationGrants: vi.fn(),
  updateInstallationSettings: vi.fn(),
  updateInstallationStatus: vi.fn(),
  updateOrgApprovalStatus: vi.fn(),
  updateInstallationSubscriptionStatus: vi.fn().mockResolvedValue(null),
  revokeInstallationCredentials: vi.fn().mockResolvedValue(null),
  registerPluginSubscriptions: vi.fn().mockResolvedValue([]),
  enqueueOutboxEvent: vi.fn().mockResolvedValue({ id: 'outbox-1', eventType: 'test', payload: {} }),
  createDeliveriesForOutboxEvent: vi.fn().mockResolvedValue([]),
  listActiveSubscriptionsForEvent: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/plugin', () => dbMocks);

import { installPlugin, resolveOrgContributions } from '@api/services/plugin/installation';

const manifestPath = path.resolve(__dirname, './fixtures/plugins/linkedin-sharing.json');
const linkedinManifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as TPluginManifest;
const announcementManifestPath = path.resolve(__dirname, './fixtures/plugins/announcement-banner.json');
const announcementManifest = JSON.parse(readFileSync(announcementManifestPath, 'utf8')) as TPluginManifest;

describe('Plugin Installation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getPluginByIdOrSlug.mockImplementation((id: string) => dbMocks.getPluginById(id));
  });

  it('installs the LinkedIn plugin without granting unused permissions', async () => {
    const installation = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      organizationId: 'organization-1',
      status: 'active'
    };

    dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id });
    dbMocks.getPluginVersion.mockResolvedValueOnce({
      id: 'version-1',
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      manifest: linkedinManifest
    });
    dbMocks.getOrganizationInstallation.mockResolvedValueOnce(null);
    dbMocks.createInstallation.mockResolvedValueOnce(installation);
    dbMocks.replaceInstallationGrants.mockResolvedValueOnce([]);

    const result = await installPlugin({
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      ownerType: 'organization',
      organizationId: 'organization-1',
      installedByProfileId: 'profile-1'
    });

    expect(result).toEqual({ installation, grants: [] });
    expect(dbMocks.replaceInstallationGrants).toHaveBeenCalledWith('installation-1', [], 'profile-1');
    expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'plugin.installed',
        resource: linkedinManifest.id,
        outcome: 'success'
      })
    );
  });

  it('re-activates and updates a previously uninstalled plugin', async () => {
    const existingUninstalled = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      organizationId: 'organization-1',
      status: 'uninstalled'
    };

    const reinstalled = {
      ...existingUninstalled,
      status: 'active'
    };

    dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id });
    dbMocks.getPluginVersion.mockResolvedValueOnce({
      id: 'version-1',
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      manifest: linkedinManifest
    });
    dbMocks.getOrganizationInstallation.mockResolvedValueOnce(existingUninstalled);
    dbMocks.reinstallInstallation.mockResolvedValueOnce(reinstalled);
    dbMocks.replaceInstallationGrants.mockResolvedValueOnce([]);

    const result = await installPlugin({
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      ownerType: 'organization',
      organizationId: 'organization-1',
      installedByProfileId: 'profile-1'
    });

    expect(result).toEqual({ installation: reinstalled, grants: [] });
    expect(dbMocks.reinstallInstallation).toHaveBeenCalledWith(
      'installation-1',
      expect.objectContaining({
        pluginVersionId: 'version-1',
        installedByProfileId: 'profile-1'
      })
    );
    expect(dbMocks.createInstallation).not.toHaveBeenCalled();
  });

  it('resolves the LinkedIn action only for an active, approved installation', async () => {
    const installedPlugin = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      status: 'active',
      orgApprovalStatus: 'approved',
      manifest: linkedinManifest
    };

    dbMocks.listOrganizationInstallations.mockResolvedValueOnce([installedPlugin]);

    const contributions = await resolveOrgContributions('organization-1', 'certificate.actions');

    expect(contributions).toEqual([
      expect.objectContaining({
        installationId: 'installation-1',
        pluginId: linkedinManifest.id,
        contributionId: 'linkedin.add-certificate-to-profile',
        target: 'certificate.actions',
        renderMode: 'host',
        actionType: 'openUrl',
        urlTemplate: 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME',
        allowedDomains: ['https://www.linkedin.com']
      })
    ]);

    dbMocks.listOrganizationInstallations.mockResolvedValueOnce([
      { ...installedPlugin, status: 'disabled' },
      { ...installedPlugin, id: 'installation-2', orgApprovalStatus: 'rejected' }
    ]);

    await expect(resolveOrgContributions('organization-1', 'certificate.actions')).resolves.toEqual([]);
  });

  it('resolves an official plugin settings navigation item and its sandboxed page', async () => {
    const installedPlugin = {
      id: 'installation-2',
      pluginId: announcementManifest.id,
      status: 'active',
      orgApprovalStatus: 'approved',
      manifest: announcementManifest,
      versionRecord: {
        version: announcementManifest.version,
        reviewStatus: 'approved',
        artifactDigest: 'sha256-test-announcement'
      }
    };

    dbMocks.listOrganizationInstallations.mockResolvedValueOnce([installedPlugin]);

    await expect(resolveOrgContributions('organization-1', 'organization.settings')).resolves.toEqual([
      expect.objectContaining({
        pluginId: announcementManifest.id,
        contributionId: 'announcement-settings-navigation',
        target: 'organization.settings',
        page: 'announcement-settings'
      })
    ]);

    dbMocks.listOrganizationInstallations.mockResolvedValueOnce([installedPlugin]);

    await expect(resolveOrgContributions('organization-1', 'plugin.page')).resolves.toEqual([
      expect.objectContaining({
        pluginId: announcementManifest.id,
        contributionId: 'announcement-settings',
        target: 'plugin.page',
        artifactUrl: expect.stringContaining(
          '/plugins/assets/com.classroomio.announcement-banner/1.0.0/sha256-test-announcement/settings.html'
        )
      })
    ]);
  });

  it('rejects installation of revoked plugins', async () => {
    dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'revoked' });
    dbMocks.getPluginVersion.mockResolvedValueOnce({
      id: 'version-1',
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      reviewStatus: 'approved'
    });

    await expect(
      installPlugin({
        pluginId: linkedinManifest.id,
        version: linkedinManifest.version,
        ownerType: 'organization',
        organizationId: 'organization-1',
        installedByProfileId: 'profile-1'
      })
    ).rejects.toThrow('This plugin has been revoked');
  });

  it('rejects installation of unapproved plugin versions', async () => {
    dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'published' });
    dbMocks.getPluginVersion.mockResolvedValueOnce({
      id: 'version-1',
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      reviewStatus: 'pending'
    });

    await expect(
      installPlugin({
        pluginId: linkedinManifest.id,
        version: linkedinManifest.version,
        ownerType: 'organization',
        organizationId: 'organization-1',
        installedByProfileId: 'profile-1'
      })
    ).rejects.toThrow('not approved for installation');
  });

  it('rejects private plugin installation outside the publishing organization', async () => {
    dbMocks.getPluginById.mockResolvedValueOnce({
      id: linkedinManifest.id,
      status: 'published',
      distribution: 'private'
    });
    dbMocks.getPluginVersion.mockResolvedValueOnce({
      id: 'version-1',
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      reviewStatus: 'approved',
      releaseMetadata: { organizationId: 'organization-owner' }
    });

    await expect(
      installPlugin({
        pluginId: linkedinManifest.id,
        version: linkedinManifest.version,
        ownerType: 'organization',
        organizationId: 'organization-other',
        installedByProfileId: 'profile-1'
      })
    ).rejects.toThrow('Private plugins can only be installed by the publishing organization');
  });

  it('blocks downgrade unless allowDowngrade is explicitly set', async () => {
    const existing = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      organizationId: 'organization-1',
      pluginVersionId: 'version-2',
      status: 'uninstalled'
    };

    dbMocks.getPluginById.mockResolvedValue({ id: linkedinManifest.id, status: 'published' });
    dbMocks.getPluginVersion.mockResolvedValue({
      id: 'version-1',
      pluginId: linkedinManifest.id,
      version: '1.0.0',
      reviewStatus: 'approved',
      manifest: linkedinManifest
    });
    dbMocks.getPluginVersionById.mockResolvedValue({
      id: 'version-2',
      pluginId: linkedinManifest.id,
      version: '2.0.0',
      manifest: linkedinManifest
    });
    dbMocks.getOrganizationInstallation.mockResolvedValue(existing);

    await expect(
      installPlugin({
        pluginId: linkedinManifest.id,
        version: '1.0.0',
        ownerType: 'organization',
        organizationId: 'organization-1',
        installedByProfileId: 'profile-1'
      })
    ).rejects.toThrow('Downgrading plugin from 2.0.0 to 1.0.0 is forbidden');

    // With allowDowngrade: true
    dbMocks.reinstallInstallation.mockResolvedValueOnce({
      ...existing,
      status: 'active'
    });
    dbMocks.replaceInstallationGrants.mockResolvedValueOnce([]);

    await expect(
      installPlugin({
        pluginId: linkedinManifest.id,
        version: '1.0.0',
        ownerType: 'organization',
        organizationId: 'organization-1',
        installedByProfileId: 'profile-1',
        allowDowngrade: true
      })
    ).resolves.toBeDefined();
  });
});
