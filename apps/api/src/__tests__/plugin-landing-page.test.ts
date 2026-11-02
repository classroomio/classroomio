import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultDocumentForTemplate } from '@cio/landing-pages';

const dbPluginMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getPluginVersionById: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

const dbOrgMocks = vi.hoisted(() => {
  class RevisionConflictError extends Error {
    constructor(
      public readonly expectedRevision: number,
      public readonly currentRevision: number
    ) {
      super(`Landing page revision changed from ${expectedRevision} to ${currentRevision}`);
    }
  }

  return {
    getOrganizationById: vi.fn(),
    setOrganizationLandingPagePresentation: vi.fn(),
    OrganizationLandingPageRevisionConflictError: RevisionConflictError
  };
});

vi.mock('@cio/db/queries/plugin', () => dbPluginMocks);
vi.mock('@cio/db/queries/organization', () => dbOrgMocks);

import { applyLandingPageTemplate, removeLandingPageTemplate } from '@api/services/plugin/landing-page';

describe('Plugin landing page template service', () => {
  const organizationId = '3cb50bb9-7621-43a3-a0fc-d942f70b487b';
  const installationId = 'c1c1c1c1-1111-4111-8111-111111111111';
  const actorProfileId = 'actor-789';
  const document = getDefaultDocumentForTemplate('bootcamp') as unknown as Record<string, unknown>;
  const manifest = {
    manifestVersion: 1,
    id: 'com.classroomio.landing-studio',
    name: 'Landing Page Studio',
    version: '1.0.0',
    description: 'Landing pages',
    publisher: 'ClassroomIO',
    license: 'Apache-2.0',
    engines: { classroomio: '>=2.0.0', pluginApi: '2026-10-08' },
    runtime: {
      ui: {
        entrypoints: {
          picker: { renderMode: 'custom', resource: 'dist/picker.html' }
        }
      }
    },
    contributes: {
      slots: [
        {
          id: 'landing-picker',
          target: 'landing.templates',
          renderMode: 'custom',
          entrypoint: 'picker',
          title: 'Landing templates'
        }
      ]
    },
    permissions: { required: ['plugin.storage:read'] },
    dataPolicy: {
      storesCustomerData: true,
      retentionAfterUninstallDays: 30,
      privacyPolicyUrl: 'https://classroomio.com/privacy'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbPluginMocks.getInstallationById.mockResolvedValue({
      id: installationId,
      pluginId: 'com.classroomio.landing-studio',
      pluginVersionId: 'version-1',
      organizationId,
      ownerType: 'organization',
      status: 'active'
    });
    dbPluginMocks.getPluginVersionById.mockResolvedValue({ id: 'version-1', version: '1.2.0', manifest });
    dbPluginMocks.recordPluginAuditEvent.mockResolvedValue({});
    dbOrgMocks.setOrganizationLandingPagePresentation.mockResolvedValue({ id: organizationId });
  });

  it('applies a template contributed through landing.templates', async () => {
    const presentation = await applyLandingPageTemplate(
      installationId,
      organizationId,
      {
        document,
        templateSourceId: 'template-1',
        templateName: 'Academy launch',
        expectedRevision: 2
      },
      actorProfileId
    );

    expect(presentation.revision).toBe(3);
    expect(presentation.source).toMatchObject({
      pluginId: 'com.classroomio.landing-studio',
      installationId,
      templateSourceId: 'template-1',
      templateName: 'Academy launch'
    });
    expect(dbOrgMocks.setOrganizationLandingPagePresentation).toHaveBeenCalledWith(
      organizationId,
      expect.objectContaining({ revision: 3, document }),
      2
    );
  });

  it('rejects a plugin without a landing.templates contribution', async () => {
    dbPluginMocks.getPluginVersionById.mockResolvedValue({
      id: 'version-1',
      version: '1.2.0',
      manifest: { ...manifest, contributes: { slots: [] } }
    });

    await expect(
      applyLandingPageTemplate(installationId, organizationId, { document, expectedRevision: 0 }, actorProfileId)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns a conflict when the active revision changed', async () => {
    dbOrgMocks.setOrganizationLandingPagePresentation.mockRejectedValue(
      new dbOrgMocks.OrganizationLandingPageRevisionConflictError(2, 3)
    );

    await expect(
      applyLandingPageTemplate(installationId, organizationId, { document, expectedRevision: 2 }, actorProfileId)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('removes the active template without deleting built-in landing page settings', async () => {
    dbOrgMocks.getOrganizationById.mockResolvedValue({
      id: organizationId,
      landingpage: {
        theme: 'quartz',
        presentation: {
          kind: 'document',
          schema: 'classroomio.landing-page',
          version: 1,
          source: {
            kind: 'plugin',
            pluginId: 'com.classroomio.landing-studio',
            installationId,
            pluginVersion: '1.2.0'
          },
          document,
          revision: 4,
          publishedAt: new Date().toISOString(),
          publishedBy: actorProfileId
        }
      }
    });

    await removeLandingPageTemplate(organizationId, 4, actorProfileId);

    expect(dbOrgMocks.setOrganizationLandingPagePresentation).toHaveBeenCalledWith(organizationId, null, 4);
    expect(dbPluginMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'plugin.landing_page_template.removed', installationId })
    );
  });
});
