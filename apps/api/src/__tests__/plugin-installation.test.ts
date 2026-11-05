import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { TPluginManifest } from '@cio/utils/validation/plugin';

const dbMocks = vi.hoisted(() => ({
  createInstallation: vi.fn(),
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getPluginUninstallDataImpact: vi.fn(),
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
  uninstallPluginInstallation: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => dbMocks);

import {
  changeInstallationSettings,
  changeInstallationStatus,
  getPluginUninstallImpact,
  installPlugin,
  resolveOrgContributions,
  uninstallPlugin
} from '@api/services/plugin/installation';

const manifestPath = path.resolve(__dirname, './fixtures/plugins/linkedin-sharing.json');
const linkedinManifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as TPluginManifest;
const announcementManifestPath = path.resolve(__dirname, './fixtures/plugins/announcement-banner.json');
const announcementManifest = JSON.parse(readFileSync(announcementManifestPath, 'utf8')) as TPluginManifest;

describe('Plugin Installation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getPluginByIdOrSlug.mockImplementation((id: string) => dbMocks.getPluginById(id));
    dbMocks.getInstallationGrants.mockResolvedValue([]);
  });

  it('installs the LinkedIn plugin without granting unused permissions', async () => {
    const installation = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      pluginVersionId: 'version-1',
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

  it('validates installation settings against the manifest schema', async () => {
    const settingsManifest = {
      ...linkedinManifest,
      settings: {
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' }
          },
          required: ['enabled'],
          additionalProperties: false
        }
      }
    };
    const installation = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      pluginVersionId: 'version-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'active',
      orgApprovalStatus: 'approved'
    };

    dbMocks.getInstallationById.mockResolvedValueOnce(installation);
    dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'active' });
    dbMocks.getPluginVersionById.mockResolvedValueOnce({ id: 'version-1', manifest: settingsManifest });

    await expect(changeInstallationSettings('installation-1', 'organization-1', {})).rejects.toThrow(
      'Plugin settings are invalid: $.enabled is required'
    );
    expect(dbMocks.updateInstallationSettings).not.toHaveBeenCalled();

    dbMocks.getInstallationById.mockResolvedValueOnce(installation);
    dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'active' });
    dbMocks.getPluginVersionById.mockResolvedValueOnce({ id: 'version-1', manifest: settingsManifest });
    dbMocks.updateInstallationSettings.mockResolvedValueOnce({ ...installation, settings: { enabled: true } });

    await expect(
      changeInstallationSettings('installation-1', 'organization-1', { enabled: true }, 'profile-1')
    ).resolves.toMatchObject({ settings: { enabled: true } });
  });

  it('reports retained data before uninstalling', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce({
      id: 'installation-1',
      pluginVersionId: 'version-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'disabled'
    });
    dbMocks.getPluginUninstallDataImpact.mockResolvedValueOnce({
      storedData: { exists: true, bytes: 512 },
      appliedContent: { certificateDesigns: 2 }
    });

    await expect(getPluginUninstallImpact('installation-1', 'organization-1')).resolves.toEqual({
      storedData: { exists: true, bytes: 512 },
      appliedContent: { certificateDesigns: 2 }
    });
  });

  it('uninstalls with the administrator cleanup choices and audits the result', async () => {
    const installation = {
      id: 'installation-1',
      pluginId: linkedinManifest.id,
      pluginVersionId: 'version-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'active'
    };
    const options = { deletePluginStorage: true, removePublishedOutputs: true };

    dbMocks.getInstallationById.mockResolvedValueOnce(installation);
    dbMocks.getPluginVersionById.mockResolvedValueOnce({ id: 'version-1', manifest: linkedinManifest });
    dbMocks.uninstallPluginInstallation.mockResolvedValueOnce({
      installation: { ...installation, status: 'uninstalled' },
      storageRecordsDeleted: 3,
      publishedOutputsRemoved: 2
    });

    await expect(uninstallPlugin('installation-1', 'organization-1', options, 'profile-1')).resolves.toEqual(
      expect.objectContaining({ storageRecordsDeleted: 3, publishedOutputsRemoved: 2 })
    );
    expect(dbMocks.uninstallPluginInstallation).toHaveBeenCalledWith('installation-1', 'organization-1', {
      ...options,
      storageRetentionDays: linkedinManifest.dataPolicy.retentionAfterUninstallDays
    });
    expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'plugin.uninstalled',
        actorProfileId: 'profile-1',
        metadata: expect.objectContaining({
          deletePluginStorage: true,
          removePublishedOutputs: true,
          storageRecordsDeleted: 3,
          publishedOutputsRemoved: 2
        })
      })
    );
  });

  it('retains storage for the manifest retention period when immediate deletion is not selected', async () => {
    const installation = {
      id: 'installation-1',
      pluginId: announcementManifest.id,
      pluginVersionId: 'version-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'active'
    };
    const options = { deletePluginStorage: false, removePublishedOutputs: false };
    dbMocks.getInstallationById.mockResolvedValueOnce(installation);
    dbMocks.getPluginVersionById.mockResolvedValueOnce({ id: 'version-1', manifest: announcementManifest });
    dbMocks.uninstallPluginInstallation.mockResolvedValueOnce({
      installation: { ...installation, status: 'uninstalled' },
      storageRecordsDeleted: 0,
      publishedOutputsRemoved: 0
    });

    await uninstallPlugin('installation-1', 'organization-1', options, 'profile-1');

    expect(dbMocks.uninstallPluginInstallation).toHaveBeenCalledWith('installation-1', 'organization-1', {
      ...options,
      storageRetentionDays: 30
    });
  });

  it('does not allow an already uninstalled plugin to be uninstalled again', async () => {
    dbMocks.getInstallationById.mockResolvedValueOnce({
      id: 'installation-1',
      organizationId: 'organization-1',
      ownerType: 'organization',
      status: 'uninstalled'
    });

    await expect(
      uninstallPlugin('installation-1', 'organization-1', {
        deletePluginStorage: false,
        removePublishedOutputs: false
      })
    ).rejects.toThrow('Plugin is not installed');
    expect(dbMocks.uninstallPluginInstallation).not.toHaveBeenCalled();
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

    await expect(resolveOrgContributions('organization-1', 'organization.navigation')).resolves.toEqual([
      expect.objectContaining({
        pluginId: announcementManifest.id,
        contributionId: 'announcement-settings-navigation',
        target: 'organization.navigation',
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

  describe('changeInstallationStatus', () => {
    it('disables an active plugin installation and records audit event', async () => {
      const activeInstallation = {
        id: 'installation-1',
        pluginId: linkedinManifest.id,
        organizationId: 'organization-1',
        ownerType: 'organization',
        status: 'active',
        orgApprovalStatus: 'approved'
      };
      const disabledInstallation = { ...activeInstallation, status: 'disabled' };

      dbMocks.getInstallationById.mockResolvedValueOnce(activeInstallation);
      dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'active' });
      dbMocks.updateInstallationStatus.mockResolvedValueOnce(disabledInstallation);

      const result = await changeInstallationStatus('installation-1', 'organization-1', 'disabled', 'profile-1');

      expect(result).toEqual(disabledInstallation);
      expect(dbMocks.updateInstallationStatus).toHaveBeenCalledWith('installation-1', 'disabled');
      expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.status_disabled',
          installationId: 'installation-1',
          outcome: 'success'
        })
      );
    });

    it('re-enables a disabled plugin installation without throwing INSTALLATION_NOT_ACTIVE', async () => {
      const disabledInstallation = {
        id: 'installation-1',
        pluginId: linkedinManifest.id,
        organizationId: 'organization-1',
        ownerType: 'organization',
        status: 'disabled',
        orgApprovalStatus: 'approved'
      };
      const activeInstallation = { ...disabledInstallation, status: 'active' };

      dbMocks.getInstallationById.mockResolvedValueOnce(disabledInstallation);
      dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'active' });
      dbMocks.updateInstallationStatus.mockResolvedValueOnce(activeInstallation);

      const result = await changeInstallationStatus('installation-1', 'organization-1', 'active', 'profile-1');

      expect(result).toEqual(activeInstallation);
      expect(dbMocks.updateInstallationStatus).toHaveBeenCalledWith('installation-1', 'active');
      expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.status_active',
          installationId: 'installation-1',
          outcome: 'success'
        })
      );
    });

    it('rejects status change for uninstalled plugin', async () => {
      const uninstalled = {
        id: 'installation-1',
        pluginId: linkedinManifest.id,
        organizationId: 'organization-1',
        ownerType: 'organization',
        status: 'uninstalled',
        orgApprovalStatus: 'approved'
      };

      dbMocks.getInstallationById.mockResolvedValueOnce(uninstalled);

      await expect(changeInstallationStatus('installation-1', 'organization-1', 'active', 'profile-1')).rejects.toThrow(
        'Plugin is not installed'
      );
    });

    it('rejects status change when plugin is not approved for the organization', async () => {
      const pendingApproval = {
        id: 'installation-1',
        pluginId: linkedinManifest.id,
        organizationId: 'organization-1',
        ownerType: 'organization',
        status: 'disabled',
        orgApprovalStatus: 'pending'
      };

      dbMocks.getInstallationById.mockResolvedValueOnce(pendingApproval);

      await expect(changeInstallationStatus('installation-1', 'organization-1', 'active', 'profile-1')).rejects.toThrow(
        'Plugin installation is not approved for this organization'
      );
    });

    it('rejects status change when the plugin itself is revoked', async () => {
      const disabledInstallation = {
        id: 'installation-1',
        pluginId: linkedinManifest.id,
        organizationId: 'organization-1',
        ownerType: 'organization',
        status: 'disabled',
        orgApprovalStatus: 'approved'
      };

      dbMocks.getInstallationById.mockResolvedValueOnce(disabledInstallation);
      dbMocks.getPluginById.mockResolvedValueOnce({ id: linkedinManifest.id, status: 'revoked' });

      await expect(changeInstallationStatus('installation-1', 'organization-1', 'active', 'profile-1')).rejects.toThrow(
        'Plugin has been revoked'
      );
    });
  });
});
