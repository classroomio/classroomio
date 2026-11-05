import { AppError, ErrorCodes } from '@api/utils/errors';
import { requireOrganizationInstallation } from '@api/services/plugin/authorization';
import { getOrgIdBySiteName, getOrganizationById, updateOrganization } from '@cio/db/queries/organization';
import { getInstallationById, getPluginVersionById, recordPluginAuditEvent } from '@cio/db/queries/plugin';
import { getPluginArtifactBaseUrl } from '@api/services/plugin/installation';
import {
  DEFAULT_NATIVE_LANDING_PAGE_THEME,
  isNativeLandingPageTheme,
  normalizeLandingPageAppearance,
  resolveEntrypointResource,
  type LandingPageAppearance,
  type NativeLandingPageTheme,
  type PublicLandingPageResponse,
  type PublicLandingPluginDescriptor,
  type TPluginDeclaredTemplate,
  type TPluginManifest
} from '@cio/utils/validation';

export interface ActivateLandingTemplateInput {
  organizationId: string;
  installationId: string;
  contributionId?: string;
  templateId: string;
  fallbackTheme?: NativeLandingPageTheme;
  actorProfileId?: string;
  skipDbUpdate?: boolean;
}

export interface ResolvedLandingPageAppearance {
  appearance: LandingPageAppearance;
  isFallback: boolean;
  resolvedVersion?: string;
  declaredTemplate?: TPluginDeclaredTemplate;
  fallbackReason?: string;
}

interface ResolveLandingTemplateDescriptorInput {
  organizationId: string;
  installationId: string;
  contributionId?: string;
  templateId: string;
}

async function resolveLandingTemplateDescriptor(
  input: ResolveLandingTemplateDescriptorInput
): Promise<PublicLandingPluginDescriptor> {
  const installation = await requireOrganizationInstallation(input.installationId, input.organizationId);
  const versionRecord = await getPluginVersionById(installation.pluginVersionId);
  if (!versionRecord || versionRecord.reviewStatus !== 'approved' || !versionRecord.artifactDigest) {
    throw new AppError('Plugin version is not approved', 'PLUGIN_VERSION_NOT_APPROVED', 403);
  }

  const manifest = versionRecord.manifest as TPluginManifest | null;
  const landingSlot = manifest?.contributes?.slots.find(
    (slot) => slot.target === 'landing.templates' && (!input.contributionId || slot.id === input.contributionId)
  );
  if (!landingSlot) {
    throw new AppError(
      'Plugin does not contribute the requested landing template',
      ErrorCodes.INVALID_CONTRIBUTION,
      400
    );
  }

  const template = landingSlot.templates?.find((candidate) => candidate.id === input.templateId);
  if (!template) {
    throw new AppError('Template not found in plugin', ErrorCodes.TEMPLATE_NOT_FOUND, 404);
  }

  const renderEntrypointName = landingSlot.publicRendererEntrypoint;
  const renderEntrypoint = renderEntrypointName
    ? manifest?.runtime?.ui?.entrypoints?.[renderEntrypointName]
    : undefined;
  const rawResource = resolveEntrypointResource(renderEntrypoint);
  if (!rawResource) {
    throw new AppError('Plugin does not declare a public landing renderer', ErrorCodes.INVALID_CONTRIBUTION, 400);
  }

  const normalizedEntrypoint = rawResource.startsWith('dist/') ? rawResource.slice('dist/'.length) : rawResource;
  const artifactBaseUrl = getPluginArtifactBaseUrl(
    installation.pluginId,
    versionRecord.version,
    versionRecord.artifactDigest
  );

  return {
    pluginId: installation.pluginId,
    installationId: installation.id,
    contributionId: landingSlot.id,
    version: versionRecord.version,
    artifactDigest: versionRecord.artifactDigest,
    entrypointUrl: `${artifactBaseUrl}/${normalizedEntrypoint}`,
    templateId: template.id,
    templateName: template.name
  };
}

export async function previewOrganizationLandingTemplate(
  input: ResolveLandingTemplateDescriptorInput & { contributionId: string }
): Promise<PublicLandingPluginDescriptor> {
  return resolveLandingTemplateDescriptor(input);
}

/**
 * Validates installation and declared slot template metadata, persisting active plugin appearance.
 */
export async function activateLandingTemplate(input: ActivateLandingTemplateInput): Promise<{
  appearance: LandingPageAppearance;
  template: TPluginDeclaredTemplate;
  pluginDescriptor: PublicLandingPluginDescriptor;
}> {
  const organization = await getOrganizationById(input.organizationId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const installation = await requireOrganizationInstallation(input.installationId, input.organizationId);

  const versionRecord = await getPluginVersionById(installation.pluginVersionId);
  if (!versionRecord || versionRecord.reviewStatus !== 'approved') {
    throw new AppError('Plugin version is not approved', 'PLUGIN_VERSION_NOT_APPROVED', 403);
  }

  const manifest = versionRecord.manifest as TPluginManifest | null;
  const slots = manifest?.contributes?.slots ?? [];
  const landingSlot = slots.find(
    (slot) => slot.target === 'landing.templates' && (!input.contributionId || slot.id === input.contributionId)
  );
  if (!landingSlot) {
    throw new AppError('Plugin does not contribute landing.templates', ErrorCodes.INVALID_CONTRIBUTION, 400);
  }

  const declaredTemplates = landingSlot.templates ?? [];
  const matchingTemplate = declaredTemplates.find((template) => template.id === input.templateId);
  if (!matchingTemplate) {
    throw new AppError('Template not found in plugin', ErrorCodes.TEMPLATE_NOT_FOUND, 404);
  }

  const resolvedFallbackTheme =
    input.fallbackTheme && isNativeLandingPageTheme(input.fallbackTheme)
      ? input.fallbackTheme
      : DEFAULT_NATIVE_LANDING_PAGE_THEME;

  const appearance: LandingPageAppearance = {
    kind: 'plugin',
    fallbackTheme: resolvedFallbackTheme,
    installationId: installation.id,
    pluginId: installation.pluginId,
    contributionId: landingSlot.id,
    templateId: input.templateId,
    version: versionRecord.version
  };

  const currentLandingPage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const nextLandingPage = {
    ...currentLandingPage,
    theme: resolvedFallbackTheme,
    appearance
  };

  if (!input.skipDbUpdate) {
    const updatedOrg = await updateOrganization(input.organizationId, { landingpage: nextLandingPage });
    if (!updatedOrg) {
      throw new AppError('Failed to update organization landing page', ErrorCodes.INTERNAL_ERROR, 500);
    }
  }

  const auditMetadata = {
    templateId: input.templateId,
    templateName: matchingTemplate.name,
    version: versionRecord.version,
    fallbackTheme: resolvedFallbackTheme
  };

  await recordPluginAuditEvent({
    installationId: installation.id,
    organizationId: input.organizationId,
    actorProfileId: input.actorProfileId,
    action: 'plugin.landing_template_activated',
    resource: `${installation.pluginId}:${input.templateId}`,
    outcome: 'success',
    metadata: auditMetadata
  });

  const pluginDescriptor = await resolveLandingTemplateDescriptor({
    organizationId: input.organizationId,
    installationId: installation.id,
    contributionId: landingSlot.id,
    templateId: input.templateId
  });

  return {
    appearance,
    template: matchingTemplate,
    pluginDescriptor
  };
}

/**
 * Deactivates plugin appearance and reverts the organization landing page to a native theme.
 */
export async function deactivateLandingTemplate(
  organizationId: string,
  fallbackTheme?: NativeLandingPageTheme,
  actorProfileId?: string
): Promise<LandingPageAppearance> {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const currentLandingPage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const currentAppearance = currentLandingPage.appearance as Record<string, unknown> | undefined;
  const resolvedTheme =
    fallbackTheme && isNativeLandingPageTheme(fallbackTheme)
      ? fallbackTheme
      : ((currentAppearance?.fallbackTheme as NativeLandingPageTheme | undefined) ?? DEFAULT_NATIVE_LANDING_PAGE_THEME);

  const appearance: LandingPageAppearance = {
    kind: 'native',
    theme: resolvedTheme
  };

  const nextLandingPage = {
    ...currentLandingPage,
    theme: resolvedTheme,
    appearance
  };

  await updateOrganization(organizationId, { landingpage: nextLandingPage });

  if (currentAppearance && currentAppearance.installationId) {
    const auditMetadata = {
      revertedToTheme: resolvedTheme,
      previousInstallationId: currentAppearance.installationId
    };

    await recordPluginAuditEvent({
      installationId: String(currentAppearance.installationId),
      organizationId,
      actorProfileId,
      action: 'plugin.landing_template_deactivated',
      resource: String(currentAppearance.pluginId ?? 'unknown'),
      outcome: 'success',
      metadata: auditMetadata
    });
  }

  return appearance;
}

/**
 * Resolves current landing page appearance, guaranteeing a valid native fallback if the plugin is uninstalled, disabled, or outdated.
 */
export async function resolveOrganizationLandingPageAppearance(
  organizationId: string
): Promise<ResolvedLandingPageAppearance> {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const landingpage = (organization.landingpage ?? {}) as Record<string, unknown>;
  const normalizedAppearance = normalizeLandingPageAppearance(landingpage.appearance, landingpage.theme);

  if (normalizedAppearance.kind === 'native') {
    return {
      appearance: normalizedAppearance,
      isFallback: false
    };
  }

  const fallbackAppearance: LandingPageAppearance = {
    kind: 'native',
    theme: normalizedAppearance.fallbackTheme
  };

  let installation;
  try {
    installation = await requireOrganizationInstallation(normalizedAppearance.installationId, organizationId);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Plugin installation is not active or approved';
    return {
      appearance: fallbackAppearance,
      isFallback: true,
      fallbackReason: reason
    };
  }

  const versionRecord = await getPluginVersionById(installation.pluginVersionId);
  if (!versionRecord || versionRecord.reviewStatus !== 'approved') {
    return {
      appearance: fallbackAppearance,
      isFallback: true,
      fallbackReason: 'Plugin version is not approved'
    };
  }

  const manifest = versionRecord.manifest as TPluginManifest | null;
  const slots = manifest?.contributes?.slots ?? [];
  const landingSlot = slots.find((slot) => slot.target === 'landing.templates');
  if (!landingSlot) {
    return {
      appearance: fallbackAppearance,
      isFallback: true,
      fallbackReason: 'Plugin no longer contributes landing.templates'
    };
  }

  const declaredTemplates = landingSlot.templates ?? [];
  const matchingTemplate = declaredTemplates.find((t) => t.id === normalizedAppearance.templateId);
  if (!matchingTemplate) {
    return {
      appearance: fallbackAppearance,
      isFallback: true,
      fallbackReason: 'Template is no longer declared by active plugin version'
    };
  }

  return {
    appearance: normalizedAppearance,
    isFallback: false,
    resolvedVersion: versionRecord.version,
    declaredTemplate: matchingTemplate
  };
}

/**
 * Resolves public landing page presentation and plugin descriptor for a given site name.
 */
export async function getPublicOrgLandingPageDescriptor(siteName: string): Promise<PublicLandingPageResponse> {
  const [org] = await getOrgIdBySiteName(siteName);
  if (!org) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const resolved = await resolveOrganizationLandingPageAppearance(org.id);
  const fallbackTheme =
    resolved.appearance.kind === 'plugin' ? resolved.appearance.fallbackTheme : resolved.appearance.theme;

  if (resolved.appearance.kind !== 'plugin' || resolved.isFallback) {
    return {
      appearance: resolved.appearance,
      isPlugin: false,
      fallbackTheme
    };
  }

  let pluginDescriptor: PublicLandingPluginDescriptor;
  try {
    pluginDescriptor = await resolveLandingTemplateDescriptor({
      organizationId: org.id,
      installationId: resolved.appearance.installationId,
      contributionId: resolved.appearance.contributionId,
      templateId: resolved.appearance.templateId
    });
  } catch {
    return {
      appearance: { kind: 'native', theme: fallbackTheme },
      isPlugin: false,
      fallbackTheme
    };
  }

  return {
    appearance: resolved.appearance,
    isPlugin: true,
    pluginDescriptor,
    fallbackTheme
  };
}
