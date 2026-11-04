import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TPluginManifest } from '@cio/utils/validation/plugin';
import { ErrorCodes } from '@api/utils/errors';

const pluginDbMocks = vi.hoisted(() => ({
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

const orgDbMocks = vi.hoisted(() => ({
  getOrganizationById: vi.fn(),
  updateOrganization: vi.fn(),
  getActiveOrganizationPlan: vi.fn(),
  checkSiteNameExists: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => pluginDbMocks);
vi.mock('@cio/db/queries/organization', () => orgDbMocks);

import {
  activateLandingTemplate,
  deactivateLandingTemplate,
  resolveOrganizationLandingPageAppearance
} from '@api/services/organization/landing-page';
import { updateOrg } from '@api/services/organization';
import { getPluginUninstallImpact, uninstallPlugin } from '@api/services/plugin/installation';

const sampleLandingTemplatesManifest = {
  manifestVersion: 1,
  id: 'com.classroomio.landing-templates',
  name: 'Creative Landing Templates',
  version: '1.0.0',
  description: 'Creative templates for academy homepages.',
  publisher: 'ClassroomIO',
  engines: {
    classroomio: '>=2.0.0',
    pluginApi: '2026-10-08'
  },
  runtime: {
    ui: {
      entrypoints: {
        picker: {
          renderMode: 'custom',
          resource: 'dist/picker.html'
        },
        render: {
          renderMode: 'custom',
          resource: 'dist/render.html'
        }
      }
    }
  },
  permissions: {
    required: []
  },
  contributes: {
    slots: [
      {
        id: 'landing-templates-picker',
        target: 'landing.templates',
        renderMode: 'custom',
        entrypoint: 'picker',
        title: 'Creative Landing Page Templates',
        templates: [
          {
            id: 'neo-brutalism',
            name: 'Neo-Brutalism',
            description: 'Chunky borders, hard drop shadows, high contrast.'
          },
          {
            id: 'midnight-aurora',
            name: 'Midnight Aurora',
            description: 'Obsidian dark mode, mesh gradients, glassmorphism.'
          }
        ]
      }
    ]
  },
  dataPolicy: {
    storesCustomerData: false,
    retentionAfterUninstallDays: 30
  }
} as unknown as TPluginManifest;

describe('Landing Template Lifecycle & Activation', () => {
  const orgId = '7d22741d-d919-482a-a708-37f2a1b18d8e';
  const installationId = '90f67be5-c1cf-41e9-86c4-b81622320b98';
  const versionId = '4c4366eb-bc4f-4d92-bf36-a3205096b797';

  beforeEach(() => {
    vi.clearAllMocks();

    orgDbMocks.getOrganizationById.mockResolvedValue({
      id: orgId,
      name: 'Acme Academy',
      siteName: 'acme',
      landingpage: {
        theme: 'quartz',
        hero: { heading: 'Welcome' }
      }
    });

    orgDbMocks.updateOrganization.mockImplementation(async (_id: string, data: Record<string, unknown>) => ({
      id: orgId,
      name: 'Acme Academy',
      ...data
    }));

    pluginDbMocks.getInstallationById.mockResolvedValue({
      id: installationId,
      pluginId: sampleLandingTemplatesManifest.id,
      pluginVersionId: versionId,
      ownerType: 'organization',
      organizationId: orgId,
      status: 'active',
      orgApprovalStatus: 'approved'
    });

    pluginDbMocks.getPluginById.mockResolvedValue({
      id: sampleLandingTemplatesManifest.id,
      status: 'approved'
    });

    pluginDbMocks.getPluginVersionById.mockResolvedValue({
      id: versionId,
      pluginId: sampleLandingTemplatesManifest.id,
      version: '1.0.0',
      reviewStatus: 'approved',
      manifest: sampleLandingTemplatesManifest
    });
  });

  describe('activateLandingTemplate', () => {
    it('activates declared template and writes appearance with fallbackTheme', async () => {
      const result = await activateLandingTemplate({
        organizationId: orgId,
        installationId,
        templateId: 'neo-brutalism',
        fallbackTheme: 'bold',
        actorProfileId: 'profile-admin'
      });

      expect(result.appearance).toEqual({
        kind: 'plugin',
        fallbackTheme: 'bold',
        installationId,
        pluginId: sampleLandingTemplatesManifest.id,
        contributionId: 'landing-templates-picker',
        templateId: 'neo-brutalism',
        version: '1.0.0'
      });
      expect(result.template.name).toBe('Neo-Brutalism');

      expect(orgDbMocks.updateOrganization).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          landingpage: expect.objectContaining({
            theme: 'bold',
            appearance: expect.objectContaining({
              kind: 'plugin',
              templateId: 'neo-brutalism'
            })
          })
        })
      );

      expect(pluginDbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          installationId,
          organizationId: orgId,
          action: 'plugin.landing_template_activated',
          resource: `${sampleLandingTemplatesManifest.id}:neo-brutalism`
        })
      );
    });

    it('rejects activation when organization is not found', async () => {
      orgDbMocks.getOrganizationById.mockResolvedValueOnce(null);

      await expect(
        activateLandingTemplate({
          organizationId: 'missing-org',
          installationId,
          templateId: 'neo-brutalism'
        })
      ).rejects.toMatchObject({ code: ErrorCodes.ORGANIZATION_NOT_FOUND });
    });

    it('rejects activation when installation is inactive', async () => {
      pluginDbMocks.getInstallationById.mockResolvedValueOnce({
        id: installationId,
        pluginId: sampleLandingTemplatesManifest.id,
        organizationId: orgId,
        ownerType: 'organization',
        status: 'disabled',
        orgApprovalStatus: 'approved'
      });

      await expect(
        activateLandingTemplate({
          organizationId: orgId,
          installationId,
          templateId: 'neo-brutalism'
        })
      ).rejects.toMatchObject({ code: 'INSTALLATION_NOT_ACTIVE' });
    });

    it('rejects activation when installation is revoked', async () => {
      pluginDbMocks.getPluginById.mockResolvedValueOnce({
        id: sampleLandingTemplatesManifest.id,
        status: 'revoked'
      });

      await expect(
        activateLandingTemplate({
          organizationId: orgId,
          installationId,
          templateId: 'neo-brutalism'
        })
      ).rejects.toMatchObject({ code: 'PLUGIN_REVOKED' });
    });

    it('rejects activation when templateId is not declared by plugin slot', async () => {
      await expect(
        activateLandingTemplate({
          organizationId: orgId,
          installationId,
          templateId: 'non-existent-template'
        })
      ).rejects.toMatchObject({ code: ErrorCodes.TEMPLATE_NOT_FOUND });
    });

    it('rejects activation when plugin does not contribute landing.templates', async () => {
      const manifestWithoutSlot = {
        ...sampleLandingTemplatesManifest,
        contributes: {
          slots: [
            {
              id: 'other-slot',
              target: 'course.sidebar',
              renderMode: 'custom',
              entrypoint: 'picker'
            }
          ]
        }
      } as unknown as TPluginManifest;

      pluginDbMocks.getPluginVersionById.mockResolvedValueOnce({
        id: versionId,
        pluginId: sampleLandingTemplatesManifest.id,
        version: '1.0.0',
        reviewStatus: 'approved',
        manifest: manifestWithoutSlot
      });

      await expect(
        activateLandingTemplate({
          organizationId: orgId,
          installationId,
          templateId: 'neo-brutalism'
        })
      ).rejects.toMatchObject({ code: ErrorCodes.INVALID_CONTRIBUTION });
    });
  });

  describe('deactivateLandingTemplate', () => {
    it('reverts appearance to native theme and audits deactivation', async () => {
      orgDbMocks.getOrganizationById.mockResolvedValueOnce({
        id: orgId,
        landingpage: {
          appearance: {
            kind: 'plugin',
            fallbackTheme: 'classic',
            installationId,
            pluginId: sampleLandingTemplatesManifest.id,
            contributionId: 'landing-templates-picker',
            templateId: 'neo-brutalism',
            version: '1.0.0'
          }
        }
      });

      const appearance = await deactivateLandingTemplate(orgId, 'minimal', 'profile-admin');

      expect(appearance).toEqual({
        kind: 'native',
        theme: 'minimal'
      });

      expect(orgDbMocks.updateOrganization).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          landingpage: expect.objectContaining({
            theme: 'minimal',
            appearance: {
              kind: 'native',
              theme: 'minimal'
            }
          })
        })
      );

      expect(pluginDbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.landing_template_deactivated',
          installationId
        })
      );
    });
  });

  describe('resolveOrganizationLandingPageAppearance', () => {
    it('resolves active plugin appearance with declared template metadata', async () => {
      orgDbMocks.getOrganizationById.mockResolvedValueOnce({
        id: orgId,
        landingpage: {
          appearance: {
            kind: 'plugin',
            fallbackTheme: 'bold',
            installationId,
            pluginId: sampleLandingTemplatesManifest.id,
            contributionId: 'landing-templates-picker',
            templateId: 'neo-brutalism',
            version: '1.0.0'
          }
        }
      });

      const resolved = await resolveOrganizationLandingPageAppearance(orgId);

      expect(resolved.isFallback).toBe(false);
      expect(resolved.appearance.kind).toBe('plugin');
      expect(resolved.declaredTemplate?.name).toBe('Neo-Brutalism');
    });

    it('falls back to fallbackTheme when installation is uninstalled or inactive', async () => {
      orgDbMocks.getOrganizationById.mockResolvedValueOnce({
        id: orgId,
        landingpage: {
          appearance: {
            kind: 'plugin',
            fallbackTheme: 'bold',
            installationId,
            pluginId: sampleLandingTemplatesManifest.id,
            contributionId: 'landing-templates-picker',
            templateId: 'neo-brutalism',
            version: '1.0.0'
          }
        }
      });

      pluginDbMocks.getInstallationById.mockResolvedValueOnce({
        id: installationId,
        organizationId: orgId,
        ownerType: 'organization',
        status: 'uninstalled',
        orgApprovalStatus: 'approved'
      });

      const resolved = await resolveOrganizationLandingPageAppearance(orgId);

      expect(resolved.isFallback).toBe(true);
      expect(resolved.appearance).toEqual({
        kind: 'native',
        theme: 'bold'
      });
    });

    it('falls back to fallbackTheme when active version removed the template on upgrade', async () => {
      const upgradedManifest = {
        ...sampleLandingTemplatesManifest,
        version: '2.0.0',
        contributes: {
          slots: [
            {
              id: 'landing-templates-picker',
              target: 'landing.templates',
              renderMode: 'custom',
              entrypoint: 'picker',
              templates: [
                {
                  id: 'midnight-aurora',
                  name: 'Midnight Aurora'
                }
              ]
            }
          ]
        }
      } as unknown as TPluginManifest;

      orgDbMocks.getOrganizationById.mockResolvedValueOnce({
        id: orgId,
        landingpage: {
          appearance: {
            kind: 'plugin',
            fallbackTheme: 'terminal',
            installationId,
            pluginId: sampleLandingTemplatesManifest.id,
            contributionId: 'landing-templates-picker',
            templateId: 'neo-brutalism',
            version: '1.0.0'
          }
        }
      });

      pluginDbMocks.getPluginVersionById.mockResolvedValueOnce({
        id: 'version-2',
        pluginId: sampleLandingTemplatesManifest.id,
        version: '2.0.0',
        reviewStatus: 'approved',
        manifest: upgradedManifest
      });

      const resolved = await resolveOrganizationLandingPageAppearance(orgId);

      expect(resolved.isFallback).toBe(true);
      expect(resolved.appearance).toEqual({
        kind: 'native',
        theme: 'terminal'
      });
      expect(resolved.fallbackReason).toContain('Template is no longer declared');
    });
  });

  describe('updateOrg with appearance validation', () => {
    it('validates plugin appearance and prevents unverified appearance injection', async () => {
      await updateOrg(orgId, {
        landingpage: {
          appearance: {
            kind: 'plugin',
            fallbackTheme: 'bold',
            installationId,
            pluginId: sampleLandingTemplatesManifest.id,
            contributionId: 'landing-templates-picker',
            templateId: 'neo-brutalism',
            version: '1.0.0'
          }
        }
      });

      expect(orgDbMocks.updateOrganization).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          landingpage: expect.objectContaining({
            theme: 'bold',
            appearance: expect.objectContaining({
              kind: 'plugin',
              templateId: 'neo-brutalism'
            })
          })
        })
      );
    });

    it('rejects updateOrg when appearance references non-existent template', async () => {
      await expect(
        updateOrg(orgId, {
          landingpage: {
            appearance: {
              kind: 'plugin',
              fallbackTheme: 'bold',
              installationId,
              pluginId: sampleLandingTemplatesManifest.id,
              contributionId: 'landing-templates-picker',
              templateId: 'non-existent',
              version: '1.0.0'
            }
          }
        })
      ).rejects.toMatchObject({ code: ErrorCodes.TEMPLATE_NOT_FOUND });
    });
  });

  describe('Uninstall impact and cleanup', () => {
    it('reports landing template usage in getPluginUninstallImpact', async () => {
      pluginDbMocks.getPluginUninstallDataImpact.mockResolvedValueOnce({
        storedData: { exists: false, bytes: 0 },
        appliedContent: { certificateDesigns: 0, landingTemplates: 1 }
      });

      const impact = await getPluginUninstallImpact(installationId, orgId);

      expect(impact.appliedContent.landingTemplates).toBe(1);
    });

    it('uninstalls plugin and records audit event with landingTemplatesReverted', async () => {
      pluginDbMocks.uninstallPluginInstallation.mockResolvedValueOnce({
        installation: { id: installationId, status: 'uninstalled', pluginId: sampleLandingTemplatesManifest.id },
        storageRecordsDeleted: 0,
        publishedOutputsRemoved: 0,
        landingTemplatesReverted: 1
      });

      const result = await uninstallPlugin(
        installationId,
        orgId,
        { deletePluginStorage: true, removePublishedOutputs: true },
        'profile-admin'
      );

      expect(result.landingTemplatesReverted).toBe(1);
      expect(pluginDbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.uninstalled',
          metadata: expect.objectContaining({
            landingTemplatesReverted: 1
          })
        })
      );
    });
  });
});
