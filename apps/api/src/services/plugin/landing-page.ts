import { AppError } from '@api/utils/errors';
import {
  getOrganizationById,
  setOrganizationLandingPagePresentation,
  OrganizationLandingPageRevisionConflictError,
  updateOrganization
} from '@cio/db/queries/organization';
import { getInstallationById, getPluginVersionById, recordPluginAuditEvent } from '@cio/db/queries/plugin';
import type { TOrganization } from '@db/types';
import {
  validateLandingPageDocument,
  type LandingPageDocumentV1,
  type LandingPagePresentationV1
} from '@cio/landing-pages';
import type { TApplyLandingPageTemplate } from '@cio/utils/validation/plugin';

async function requireActiveLandingPagePluginInstallation(installationId: string, organizationId: string) {
  const installation = await getInstallationById(installationId);
  if (!installation || installation.organizationId !== organizationId || installation.ownerType !== 'organization') {
    throw new AppError('Plugin installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active') {
    throw new AppError('Plugin installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  return installation;
}

export interface PublishLandingPageInput {
  document: unknown;
  templateSourceId?: string;
  templateName?: string;
}

export async function publishLandingPage(
  installationId: string,
  organizationId: string,
  input: PublishLandingPageInput,
  actorProfileId: string
): Promise<{ success: boolean; presentation: LandingPagePresentationV1 }> {
  const installation = await requireActiveLandingPagePluginInstallation(installationId, organizationId);

  const validation = validateLandingPageDocument(input.document);
  if (!validation.success || !validation.data) {
    throw new AppError(validation.error || 'Invalid landing page document', 'INVALID_LANDING_PAGE_DOCUMENT', 400);
  }

  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 'ORGANIZATION_NOT_FOUND', 404);
  }

  let pluginVersion = '1.0.0';
  if (installation.pluginVersionId) {
    const versionRecord = await getPluginVersionById(installation.pluginVersionId);
    if (versionRecord?.version) {
      pluginVersion = versionRecord.version;
    }
  }

  const existingLandingPage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const currentPresentation = existingLandingPage.presentation as LandingPagePresentationV1 | undefined;
  const nextRevision = typeof currentPresentation?.revision === 'number' ? currentPresentation.revision + 1 : 1;

  const presentation: LandingPagePresentationV1 = {
    kind: 'document',
    schema: 'classroomio.landing-page',
    version: 1,
    source: {
      kind: 'plugin',
      pluginId: installation.pluginId,
      installationId: installation.id,
      pluginVersion,
      templateSourceId: input.templateSourceId,
      templateName: input.templateName
    },
    document: validation.data,
    revision: nextRevision,
    publishedAt: new Date().toISOString(),
    publishedBy: actorProfileId
  };

  const nextLandingPage = {
    ...existingLandingPage,
    presentation
  } as unknown as TOrganization['landingpage'];

  await updateOrganization(organizationId, { landingpage: nextLandingPage });

  await recordPluginAuditEvent({
    installationId,
    organizationId,
    actorProfileId,
    action: 'plugin.landing_page.published',
    resource: installation.pluginId,
    outcome: 'success',
    metadata: {
      revision: nextRevision,
      templateId: validation.data.templateId,
      templateSourceId: input.templateSourceId,
      templateName: input.templateName
    }
  });

  return {
    success: true,
    presentation
  };
}

export async function unpublishLandingPage(
  installationId: string,
  organizationId: string,
  actorProfileId: string
): Promise<{ success: boolean }> {
  const installation = await requireActiveLandingPagePluginInstallation(installationId, organizationId);

  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 'ORGANIZATION_NOT_FOUND', 404);
  }

  const existingLandingPage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const nextLandingPage = {
    ...existingLandingPage,
    presentation: null
  } as TOrganization['landingpage'];

  await updateOrganization(organizationId, { landingpage: nextLandingPage });

  await recordPluginAuditEvent({
    installationId,
    organizationId,
    actorProfileId,
    action: 'plugin.landing_page.unpublished',
    resource: installation.pluginId,
    outcome: 'success'
  });

  return { success: true };
}

export async function clearOrganizationLandingPagePresentation(organizationId: string): Promise<{ success: boolean }> {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 'ORGANIZATION_NOT_FOUND', 404);
  }

  const existingLandingPage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const nextLandingPage = {
    ...existingLandingPage,
    presentation: null
  } as TOrganization['landingpage'];

  await updateOrganization(organizationId, { landingpage: nextLandingPage });
  return { success: true };
}

export async function applyLandingPageTemplate(
  installationId: string,
  organizationId: string,
  input: TApplyLandingPageTemplate,
  actorProfileId: string
): Promise<LandingPagePresentationV1> {
  const installation = await requireActiveLandingPagePluginInstallation(installationId, organizationId);

  const versionRecord = installation.pluginVersionId ? await getPluginVersionById(installation.pluginVersionId) : null;

  const slots = (versionRecord?.manifest as any)?.contributes?.slots as Array<{ target?: string }> | undefined;
  const hasLandingSlot = Array.isArray(slots) && slots.some((s) => s.target === 'landing.templates');
  if (!hasLandingSlot) {
    throw new AppError('Plugin does not contribute landing.templates slot', 'SLOT_NOT_SUPPORTED', 403);
  }

  const validation = validateLandingPageDocument(input.document);
  if (!validation.success || !validation.data) {
    throw new AppError(validation.error || 'Invalid landing page document', 'INVALID_LANDING_PAGE_DOCUMENT', 400);
  }

  const nextRevision = (input.expectedRevision ?? 0) + 1;

  const presentation: LandingPagePresentationV1 = {
    kind: 'document',
    schema: 'classroomio.landing-page',
    version: 1,
    source: {
      kind: 'plugin',
      pluginId: installation.pluginId,
      installationId: installation.id,
      pluginVersion: versionRecord?.version ?? '1.0.0',
      templateSourceId: input.templateSourceId,
      templateName: input.templateName
    },
    document: validation.data,
    revision: nextRevision,
    publishedAt: new Date().toISOString(),
    publishedBy: actorProfileId
  };

  try {
    await setOrganizationLandingPagePresentation(
      organizationId,
      presentation as unknown as Record<string, unknown>,
      input.expectedRevision
    );
  } catch (error) {
    if (error instanceof OrganizationLandingPageRevisionConflictError) {
      throw new AppError(error.message, 'REVISION_CONFLICT', 409);
    }
    throw error;
  }

  await recordPluginAuditEvent({
    installationId,
    organizationId,
    actorProfileId,
    action: 'plugin.landing_page_template.applied',
    resource: installation.pluginId,
    outcome: 'success',
    metadata: {
      revision: nextRevision,
      templateId: validation.data.templateId,
      templateSourceId: input.templateSourceId,
      templateName: input.templateName
    }
  });

  return presentation;
}

export async function removeLandingPageTemplate(
  organizationId: string,
  expectedRevision: number,
  actorProfileId: string
): Promise<{ success: boolean }> {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 'ORGANIZATION_NOT_FOUND', 404);
  }

  const landingPage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const currentPresentation = landingPage.presentation as LandingPagePresentationV1 | null | undefined;
  const installationId =
    currentPresentation?.source?.kind === 'plugin' ? currentPresentation.source.installationId : undefined;
  const pluginId = currentPresentation?.source?.kind === 'plugin' ? currentPresentation.source.pluginId : 'unknown';

  try {
    await setOrganizationLandingPagePresentation(organizationId, null, expectedRevision);
  } catch (error) {
    if (error instanceof OrganizationLandingPageRevisionConflictError) {
      throw new AppError(error.message, 'REVISION_CONFLICT', 409);
    }
    throw error;
  }

  if (installationId) {
    await recordPluginAuditEvent({
      installationId,
      organizationId,
      actorProfileId,
      action: 'plugin.landing_page_template.removed',
      resource: pluginId,
      outcome: 'success',
      metadata: {
        revision: expectedRevision
      }
    });
  }

  return { success: true };
}
