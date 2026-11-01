import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultDocumentForTemplate } from '@cio/landing-pages';

const dbPluginMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getPluginVersionById: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

const dbOrgMocks = vi.hoisted(() => ({
  getOrganizationById: vi.fn(),
  updateOrganization: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => dbPluginMocks);
vi.mock('@cio/db/queries/organization', () => dbOrgMocks);

import {
  clearOrganizationLandingPagePresentation,
  publishLandingPage,
  unpublishLandingPage
} from '@api/services/plugin/landing-page';

describe('Plugin Landing Page Service', () => {
  const orgId = 'org-123';
  const installationId = 'inst-456';
  const actorProfileId = 'actor-789';

  const mockActiveInstallation = {
    id: installationId,
    pluginId: 'com.classroomio.landing-studio',
    pluginVersionId: 'version-1',
    organizationId: orgId,
    ownerType: 'organization',
    status: 'active'
  };

  const mockOrganization = {
    id: orgId,
    name: 'Acme Academy',
    siteName: 'acme',
    landingpage: {
      theme: 'quartz',
      hero: { heading: 'Original built-in headline' },
      footer: { copyright: 'Original footer' }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbPluginMocks.getInstallationById.mockResolvedValue(mockActiveInstallation);
    dbPluginMocks.getPluginVersionById.mockResolvedValue({ id: 'version-1', version: '1.2.0' });
    dbOrgMocks.getOrganizationById.mockResolvedValue({ ...mockOrganization });
    dbOrgMocks.updateOrganization.mockResolvedValue({});
    dbPluginMocks.recordPluginAuditEvent.mockResolvedValue({});
  });

  it('publishes a landing page document and creates LandingPagePresentationV1', async () => {
    const doc = getDefaultDocumentForTemplate('bootcamp');
    const result = await publishLandingPage(
      installationId,
      orgId,
      {
        document: doc,
        templateSourceId: 'bootcamp',
        templateName: 'Bootcamp'
      },
      actorProfileId
    );

    expect(result.success).toBe(true);
    expect(result.presentation.kind).toBe('document');
    expect(result.presentation.version).toBe(1);
    expect(result.presentation.revision).toBe(1);
    expect(result.presentation.source).toEqual({
      kind: 'plugin',
      pluginId: 'com.classroomio.landing-studio',
      installationId,
      pluginVersion: '1.2.0',
      templateSourceId: 'bootcamp',
      templateName: 'Bootcamp'
    });
    expect(result.presentation.publishedBy).toBe(actorProfileId);

    // Verify updateOrganization called preserving existing landingpage keys
    expect(dbOrgMocks.updateOrganization).toHaveBeenCalledTimes(1);
    const updateArg = dbOrgMocks.updateOrganization.mock.calls[0][1];
    expect(updateArg.landingpage.theme).toBe('quartz');
    expect(updateArg.landingpage.hero).toEqual({ heading: 'Original built-in headline' });
    expect(updateArg.landingpage.presentation).toEqual(result.presentation);

    // Verify audit event
    expect(dbPluginMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId,
        organizationId: orgId,
        action: 'plugin.landing_page.published',
        outcome: 'success'
      })
    );
  });

  it('increments revision when publishing over an existing presentation', async () => {
    const existingOrgWithPresentation = {
      ...mockOrganization,
      landingpage: {
        ...mockOrganization.landingpage,
        presentation: {
          revision: 3
        }
      }
    };
    dbOrgMocks.getOrganizationById.mockResolvedValue(existingOrgWithPresentation);

    const doc = getDefaultDocumentForTemplate('modern');
    const result = await publishLandingPage(installationId, orgId, { document: doc }, actorProfileId);

    expect(result.presentation.revision).toBe(4);
  });

  it('rejects publishing when document is invalid', async () => {
    const invalidDoc = {
      ...getDefaultDocumentForTemplate('modern'),
      theme: { primaryColor: 'invalid-color' }
    };

    await expect(publishLandingPage(installationId, orgId, { document: invalidDoc }, actorProfileId)).rejects.toThrow();
  });

  it('unpublishes landing page by setting presentation to null while preserving settings', async () => {
    const orgWithPresentation = {
      ...mockOrganization,
      landingpage: {
        ...mockOrganization.landingpage,
        presentation: { revision: 1 }
      }
    };
    dbOrgMocks.getOrganizationById.mockResolvedValue(orgWithPresentation);

    const result = await unpublishLandingPage(installationId, orgId, actorProfileId);
    expect(result.success).toBe(true);

    const updateArg = dbOrgMocks.updateOrganization.mock.calls[0][1];
    expect(updateArg.landingpage.presentation).toBeNull();
    expect(updateArg.landingpage.theme).toBe('quartz');
    expect(updateArg.landingpage.hero).toEqual({ heading: 'Original built-in headline' });

    expect(dbPluginMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'plugin.landing_page.unpublished',
        outcome: 'success'
      })
    );
  });

  it('clears presentation via clearOrganizationLandingPagePresentation', async () => {
    const result = await clearOrganizationLandingPagePresentation(orgId);
    expect(result.success).toBe(true);

    const updateArg = dbOrgMocks.updateOrganization.mock.calls[0][1];
    expect(updateArg.landingpage.presentation).toBeNull();
  });
});
