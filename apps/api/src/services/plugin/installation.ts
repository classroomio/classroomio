import { API_SERVER_URL } from '@api/constants';
import { AppError } from '@api/utils/errors';
import {
  createInstallation,
  getInstallationById,
  getPluginUninstallDataImpact,
  getOrganizationInstallation,
  getPluginById,
  getPluginByIdOrSlug,
  getPluginVersion,
  getPluginVersionById,
  getUserInstallation,
  listOrganizationInstallations,
  listPluginVersions,
  recordPluginAuditEvent,
  reinstallInstallation,
  replaceInstallationGrants,
  updateInstallationSettings as updateInstallationSettingsQuery,
  updateInstallationStatus as updateInstallationStatusQuery,
  updateOrgApprovalStatus as updateOrgApprovalStatusQuery,
  getInstallationGrants,
  uninstallPluginInstallation
} from '@cio/db/queries/plugin';
import { requireOrganizationInstallation } from './authorization';
import type {
  TNewPluginInstallation,
  TPlugin,
  TPluginGrant,
  TPluginInstallation,
  TPluginInstallationStatus,
  TPluginOrgApprovalStatus,
  TPluginOwnerType,
  TPluginVersion
} from '@cio/db/types';
import type { TInstalledPluginWithDetails } from '@cio/db/queries/plugin';
import { ZPluginManifest, validatePluginJsonValue } from '@cio/utils/validation/plugin';

function parseSemVer(v: string): [number, number, number] {
  const clean = v.replace(/^v/, '').split('-')[0];
  const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function isSemVerLessThan(v1: string, v2: string): boolean {
  const [maj1, min1, pat1] = parseSemVer(v1);
  const [maj2, min2, pat2] = parseSemVer(v2);
  if (maj1 !== maj2) return maj1 < maj2;
  if (min1 !== min2) return min1 < min2;
  return pat1 < pat2;
}

function assertInstallationSettingsAreValid(manifestValue: unknown, settings: Record<string, unknown>): void {
  const manifestResult = ZPluginManifest.safeParse(manifestValue);
  if (!manifestResult.success) {
    throw new AppError('Plugin version has an invalid manifest', 'INVALID_PLUGIN_MANIFEST', 500);
  }

  const settingsSchema = manifestResult.data.settings?.schema;
  if (!settingsSchema) return;

  const validationError = validatePluginJsonValue(settings, settingsSchema);
  if (validationError) {
    throw new AppError(`Plugin settings are invalid: ${validationError}`, 'INVALID_PLUGIN_SETTINGS', 400);
  }
}

export async function assertInstallableRelease(params: {
  plugin: TPlugin;
  versionRecord: TPluginVersion;
  targetOrgId?: string;
  currentInstallation?: TPluginInstallation | null;
  allowDowngrade?: boolean;
}): Promise<void> {
  const { plugin, versionRecord, targetOrgId, currentInstallation, allowDowngrade } = params;

  if (plugin.status === 'revoked') {
    throw new AppError('This plugin has been revoked and cannot be installed', 'PLUGIN_REVOKED', 403);
  }

  if (plugin.status === 'deprecated' && !currentInstallation) {
    throw new AppError('This plugin has been deprecated and cannot be installed', 'PLUGIN_DEPRECATED', 400);
  }

  if (versionRecord.reviewStatus && versionRecord.reviewStatus !== 'approved') {
    throw new AppError(
      `Plugin version ${versionRecord.version} is not approved for installation (review status: ${versionRecord.reviewStatus})`,
      'PLUGIN_VERSION_NOT_APPROVED',
      403
    );
  }

  if (plugin.distribution === 'private') {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Private plugins cannot be installed in production', 'PLUGIN_PRIVATE_ACCESS_DENIED', 403);
    }

    if (!targetOrgId) {
      throw new AppError(
        'Private plugins require an organization installation target',
        'PLUGIN_PRIVATE_ACCESS_DENIED',
        403
      );
    }

    const allowedOrgId = (versionRecord.releaseMetadata as { organizationId?: string } | null)?.organizationId;
    if (allowedOrgId && allowedOrgId !== targetOrgId) {
      throw new AppError(
        'Private plugins can only be installed by the publishing organization',
        'PLUGIN_PRIVATE_ACCESS_DENIED',
        403
      );
    }
  }

  if (versionRecord.releasedBy === 'development') {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Development plugins cannot be installed in production', 'PLUGIN_PRIVATE_ACCESS_DENIED', 403);
    }

    const developmentOrgId = (versionRecord.releaseMetadata as { organizationId?: string } | null)?.organizationId;
    if (!targetOrgId || developmentOrgId !== targetOrgId) {
      throw new AppError(
        'Development plugins can only be installed by the publishing organization',
        'PLUGIN_PRIVATE_ACCESS_DENIED',
        403
      );
    }
  }

  if (currentInstallation && currentInstallation.pluginVersionId && !allowDowngrade) {
    const currentVersionRecord = await getPluginVersionById(currentInstallation.pluginVersionId);
    if (currentVersionRecord && isSemVerLessThan(versionRecord.version, currentVersionRecord.version)) {
      throw new AppError(
        `Downgrading plugin from ${currentVersionRecord.version} to ${versionRecord.version} is forbidden without explicit downgrade consent`,
        'PLUGIN_DOWNGRADE_FORBIDDEN',
        400
      );
    }
  }
}

export interface InstallPluginParams {
  pluginId: string;
  version: string;
  ownerType: TPluginOwnerType;
  organizationId?: string;
  userId?: string;
  installedByProfileId?: string;
  settings?: Record<string, unknown>;
  allowDowngrade?: boolean;
  replaceExisting?: boolean;
}

export async function installPlugin(params: InstallPluginParams): Promise<{
  installation: TPluginInstallation;
  grants: TPluginGrant[];
}> {
  const pluginRecord = await getPluginByIdOrSlug(params.pluginId);
  if (!pluginRecord) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }

  const actualPluginId = pluginRecord.id;
  const versionRecord = await getPluginVersion(actualPluginId, params.version);
  if (!versionRecord) {
    throw new AppError('Plugin version not found', 'PLUGIN_VERSION_NOT_FOUND', 404);
  }

  let existingInstallation: TPluginInstallation | null = null;

  if (params.ownerType === 'organization') {
    if (!params.organizationId) {
      throw new AppError('Organization ID is required for organization installations', 'INVALID_PARAMS', 400);
    }

    existingInstallation = await getOrganizationInstallation(params.organizationId, actualPluginId);
    if (existingInstallation && existingInstallation.status !== 'uninstalled' && !params.replaceExisting) {
      throw new AppError('Plugin is already installed for this organization', 'PLUGIN_ALREADY_INSTALLED', 409);
    }
  } else {
    if (!params.userId) {
      throw new AppError('User ID is required for user installations', 'INVALID_PARAMS', 400);
    }

    existingInstallation = await getUserInstallation(params.userId, actualPluginId);
    if (existingInstallation && existingInstallation.status !== 'uninstalled' && !params.replaceExisting) {
      throw new AppError('Plugin is already installed for this user', 'PLUGIN_ALREADY_INSTALLED', 409);
    }
  }

  await assertInstallableRelease({
    plugin: pluginRecord,
    versionRecord,
    targetOrgId: params.organizationId,
    currentInstallation: existingInstallation,
    allowDowngrade: params.allowDowngrade
  });

  const initialSettings = params.settings ?? {};
  assertInstallationSettingsAreValid(versionRecord.manifest, initialSettings);
  let installation: TPluginInstallation;

  if (existingInstallation) {
    const reinstalled = await reinstallInstallation(existingInstallation.id, {
      pluginVersionId: versionRecord.id,
      installedByProfileId: params.installedByProfileId,
      settings: initialSettings
    });
    if (!reinstalled) {
      throw new AppError('Failed to reinstall plugin', 'INSTALLATION_FAILED', 500);
    }
    installation = reinstalled;
  } else {
    const newInstallationData: TNewPluginInstallation = {
      pluginId: actualPluginId,
      pluginVersionId: versionRecord.id,
      ownerType: params.ownerType,
      organizationId: params.organizationId,
      userId: params.userId,
      status: 'active',
      orgApprovalStatus: 'approved',
      settings: initialSettings,
      installedByProfileId: params.installedByProfileId
    };

    installation = await createInstallation(newInstallationData);
  }

  const manifest = versionRecord.manifest as
    | {
        permissions?: { required?: string[] };
      }
    | null
    | undefined;
  const requiredScopes = manifest?.permissions?.required ?? [];

  const grants = await replaceInstallationGrants(installation.id, requiredScopes, params.installedByProfileId);

  const auditMetadata = {
    version: params.version,
    ownerType: params.ownerType,
    scopesGranted: requiredScopes
  };

  await recordPluginAuditEvent({
    installationId: installation.id,
    organizationId: params.organizationId,
    actorProfileId: params.installedByProfileId,
    action: 'plugin.installed',
    resource: params.pluginId,
    outcome: 'success',
    metadata: auditMetadata
  });

  return {
    installation,
    grants
  };
}

export type PluginInstallationWithIcon = TInstalledPluginWithDetails & {
  iconUrl?: string;
};

export async function listOrgPlugins(
  organizationId: string,
  options: { activeOnly?: boolean } = {}
): Promise<PluginInstallationWithIcon[]> {
  const installations = await listOrganizationInstallations(organizationId, options);

  return installations.map((installation) => {
    const manifest = installation.manifest as { icon?: { resource?: string } } | null;
    const iconResource = manifest?.icon?.resource;
    if (!iconResource) return installation;

    const versionRecord = installation.versionRecord;
    const artifactBaseUrl =
      versionRecord?.reviewStatus === 'approved' && versionRecord.artifactDigest
        ? getPluginArtifactBaseUrl(installation.pluginId, versionRecord.version, versionRecord.artifactDigest)
        : null;

    return {
      ...installation,
      iconUrl: resolvePluginIconAssetUrl(artifactBaseUrl, iconResource)
    };
  });
}

async function requireManageableOrganizationInstallation(installationId: string, organizationId: string) {
  const installation = await getInstallationById(installationId);
  if (!installation || installation.organizationId !== organizationId || installation.ownerType !== 'organization') {
    throw new AppError('Plugin installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status === 'uninstalled' || installation.status === 'revoked') {
    throw new AppError('Plugin is not installed', 'INSTALLATION_NOT_ACTIVE', 409);
  }

  return installation;
}

export async function getInstallation(
  installationId: string,
  organizationId: string
): Promise<{
  installation: TPluginInstallation;
  grants: TPluginGrant[];
}> {
  const installation = await requireManageableOrganizationInstallation(installationId, organizationId);

  const grants = await getInstallationGrants(installationId);

  return {
    installation,
    grants
  };
}

export async function changeInstallationStatus(
  installationId: string,
  organizationId: string,
  status: TPluginInstallationStatus,
  actorProfileId?: string
): Promise<TPluginInstallation> {
  const installation = await requireManageableOrganizationInstallation(installationId, organizationId);

  if (installation.orgApprovalStatus !== 'approved') {
    throw new AppError('Plugin installation is not approved for this organization', 'INSTALLATION_NOT_APPROVED', 403);
  }

  const plugin = await getPluginById(installation.pluginId);
  if (!plugin || plugin.status === 'revoked') {
    throw new AppError('Plugin has been revoked', 'PLUGIN_REVOKED', 403);
  }

  const updatedInstallation = await updateInstallationStatusQuery(installationId, status);
  if (!updatedInstallation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  const auditMetadata = { status };

  await recordPluginAuditEvent({
    installationId,
    organizationId: updatedInstallation.organizationId,
    actorProfileId,
    action: `plugin.status_${status}`,
    resource: updatedInstallation.pluginId,
    outcome: 'success',
    metadata: auditMetadata
  });

  return updatedInstallation;
}

export async function getPluginUninstallImpact(installationId: string, organizationId: string) {
  await requireManageableOrganizationInstallation(installationId, organizationId);

  return getPluginUninstallDataImpact(installationId, organizationId);
}

export async function uninstallPlugin(
  installationId: string,
  organizationId: string,
  options: { deletePluginStorage: boolean; removePublishedOutputs: boolean },
  actorProfileId?: string
) {
  const installation = await requireManageableOrganizationInstallation(installationId, organizationId);
  const version = await getPluginVersionById(installation.pluginVersionId);
  const manifest = version ? ZPluginManifest.parse(version.manifest) : null;
  const storageRetentionDays = manifest?.dataPolicy?.retentionAfterUninstallDays ?? 0;
  const deletePluginStorage = options.deletePluginStorage || storageRetentionDays === 0;
  const uninstallOptions = { ...options, deletePluginStorage, storageRetentionDays };
  const result = await uninstallPluginInstallation(installationId, organizationId, uninstallOptions);
  if (!result?.installation) {
    throw new AppError('Plugin installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  await recordPluginAuditEvent({
    installationId,
    organizationId,
    actorProfileId,
    action: 'plugin.uninstalled',
    resource: installation.pluginId,
    outcome: 'success',
    metadata: {
      ...uninstallOptions,
      storageRecordsDeleted: result.storageRecordsDeleted,
      publishedOutputsRemoved: result.publishedOutputsRemoved,
      landingTemplatesReverted: result.landingTemplatesReverted
    }
  });

  return result;
}

export async function changeInstallationSettings(
  installationId: string,
  organizationId: string,
  settings: Record<string, unknown>,
  actorProfileId?: string
): Promise<TPluginInstallation> {
  const installation = await requireManageableOrganizationInstallation(installationId, organizationId);
  const plugin = await getPluginById(installation.pluginId);
  if (!plugin || plugin.status === 'revoked') {
    throw new AppError('Plugin has been revoked', 'PLUGIN_REVOKED', 403);
  }

  const versionRecord = installation.pluginVersionId ? await getPluginVersionById(installation.pluginVersionId) : null;
  if (!versionRecord) {
    throw new AppError('Plugin version not found', 'PLUGIN_VERSION_NOT_FOUND', 404);
  }

  assertInstallationSettingsAreValid(versionRecord.manifest, settings);

  const updatedInstallation = await updateInstallationSettingsQuery(installationId, settings);
  if (!updatedInstallation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  await recordPluginAuditEvent({
    installationId,
    organizationId: updatedInstallation.organizationId,
    actorProfileId,
    action: 'plugin.settings_updated',
    resource: updatedInstallation.pluginId,
    outcome: 'success',
    metadata: {}
  });

  return updatedInstallation;
}

export async function changeOrgApproval(
  installationId: string,
  organizationId: string,
  approval: TPluginOrgApprovalStatus,
  actorProfileId?: string
): Promise<TPluginInstallation> {
  const installation = await requireManageableOrganizationInstallation(installationId, organizationId);

  const updatedInstallation = await updateOrgApprovalStatusQuery(installationId, approval);
  if (!updatedInstallation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  const auditMetadata = { approval };
  await recordPluginAuditEvent({
    installationId,
    organizationId: updatedInstallation.organizationId,
    actorProfileId,
    action: `plugin.org_approval_${approval}`,
    resource: updatedInstallation.pluginId,
    outcome: 'success',
    metadata: auditMetadata
  });

  return updatedInstallation;
}

export interface ResolvedPluginContribution {
  installationId: string;
  pluginId: string;
  pluginSlug?: string;
  version: string;
  contributionId: string;
  target: string;
  renderMode: 'host' | 'custom';
  artifactUrl?: string;
  title: string;
  label?: string;
  iconUrl?: string;
  actionType?: 'openUrl' | 'command' | 'dialog';
  urlTemplate?: string;
  allowedDomains?: string[];
  grantedScopes: string[];
  page?: string;
  order: number;
  visibility: 'all' | 'admin' | 'tutor' | 'learner';
  pageModes: Array<'view' | 'edit'>;
}

export function getPluginArtifactBaseUrl(pluginId: string, version: string, digest: string): string {
  const configuredAssetOrigin = process.env.PLUGIN_ASSET_ORIGIN;
  if (process.env.NODE_ENV === 'production' && !configuredAssetOrigin) {
    throw new AppError('Plugin artifact origin is not configured', 'INTERNAL_ERROR', 500);
  }

  const assetOrigin = configuredAssetOrigin ?? `${API_SERVER_URL}/plugins/assets`;
  const normalizedOrigin = assetOrigin.replace(/\/$/, '');

  return `${normalizedOrigin}/${encodeURIComponent(pluginId)}/${encodeURIComponent(version)}/${encodeURIComponent(digest)}`;
}

function resolvePluginIconAssetUrl(artifactBaseUrl: string | null, resource: string | undefined): string | undefined {
  if (!artifactBaseUrl || !resource || resource.startsWith('/') || resource.includes('..')) return undefined;

  const encodedResource = resource.split('/').map(encodeURIComponent).join('/');
  return `${artifactBaseUrl}/${encodedResource}`;
}

function normalizePluginEntrypointPath(resource: string): string {
  return resource.startsWith('dist/') ? resource.slice('dist/'.length) : resource;
}

export async function resolveOrgContributions(
  organizationId: string,
  target?: string,
  options: { role?: 'admin' | 'tutor' | 'learner'; pageMode?: 'view' | 'edit' } = {}
): Promise<ResolvedPluginContribution[]> {
  const installations = await listOrganizationInstallations(organizationId);
  const activeApproved = installations.filter(
    (inst) => inst.status === 'active' && inst.orgApprovalStatus === 'approved'
  );

  const resolved: ResolvedPluginContribution[] = [];

  for (const inst of activeApproved) {
    const grants = await getInstallationGrants(inst.id);
    const grantedScopes = grants.map((grant) => grant.scope);
    const manifest = inst.manifest as {
      version?: string;
      contributes?: {
        slots?: Array<{
          id: string;
          target: string;
          renderMode?: 'custom' | 'host';
          entrypoint?: string;
          pickerEntrypoint?: string;
          title?: string;
          order?: number;
          visibility?: 'all' | 'admin' | 'tutor' | 'learner';
          pageModes?: Array<'view' | 'edit'>;
        }>;
        actions?: Array<{
          id: string;
          target: string;
          renderMode?: 'host';
          label?: string;
          icon?: { resource?: string };
          actionType?: 'openUrl';
          urlTemplate?: string;
          order?: number;
          visibility?: 'all' | 'admin' | 'tutor' | 'learner';
          pageModes?: Array<'view' | 'edit'>;
        }>;
        pages?: Array<{
          id: string;
          entrypoint: string;
          title?: string;
          order?: number;
          visibility?: 'all' | 'admin' | 'tutor' | 'learner';
          pageModes?: Array<'view' | 'edit'>;
        }>;
        navigation?: Array<{
          id: string;
          title: string;
          location: string;
          page: string;
          icon?: { resource?: string };
          visibility?: string;
          order?: number;
          pageModes?: Array<'view' | 'edit'>;
        }>;
      };
      runtime?: {
        ui?: {
          entrypoints?: Record<string, string | { renderMode?: string; resource: string }>;
        };
      };
      networkAccess?: {
        allowedDomains?: string[];
      };
    } | null;

    if (!manifest?.contributes) continue;

    const versionRecord = inst.versionRecord;
    const artifactBaseUrl =
      versionRecord?.reviewStatus === 'approved' && versionRecord.artifactDigest
        ? getPluginArtifactBaseUrl(inst.pluginId, versionRecord.version, versionRecord.artifactDigest)
        : null;

    if (manifest.contributes.slots) {
      for (const slot of manifest.contributes.slots) {
        if (target && slot.target !== target) continue;

        const renderMode = slot.renderMode ?? 'custom';
        let artifactUrl: string | undefined = undefined;

        const entrypointName = slot.target === 'landing.templates' ? slot.pickerEntrypoint : slot.entrypoint;
        if (renderMode === 'custom' && artifactBaseUrl && entrypointName && manifest.runtime?.ui?.entrypoints) {
          const rawEntry = manifest.runtime.ui.entrypoints[entrypointName];
          const entrypointPath = typeof rawEntry === 'string' ? rawEntry : rawEntry?.resource;
          if (entrypointPath) {
            artifactUrl = `${artifactBaseUrl}/${normalizePluginEntrypointPath(entrypointPath)}`;
          }
        }

        resolved.push({
          installationId: inst.id,
          pluginId: inst.pluginId,
          pluginSlug: inst.plugin?.slug ?? undefined,
          version: manifest.version ?? '1.0.0',
          contributionId: slot.id,
          target: slot.target,
          renderMode,
          artifactUrl,
          grantedScopes,
          title: slot.title ?? slot.id,
          order: slot.order ?? 0,
          visibility: slot.visibility ?? 'all',
          pageModes: slot.pageModes ?? ['view']
        });
      }
    }

    if (manifest.contributes.actions) {
      for (const action of manifest.contributes.actions) {
        if (target && action.target !== target) continue;

        const renderMode = action.renderMode ?? 'host';

        resolved.push({
          installationId: inst.id,
          pluginId: inst.pluginId,
          pluginSlug: inst.plugin?.slug ?? undefined,
          version: manifest.version ?? '1.0.0',
          contributionId: action.id,
          target: action.target,
          renderMode,
          title: action.label ?? action.id,
          label: action.label,
          iconUrl: resolvePluginIconAssetUrl(artifactBaseUrl, action.icon?.resource),
          actionType: action.actionType,
          urlTemplate: action.urlTemplate,
          allowedDomains: manifest.networkAccess?.allowedDomains ?? [],
          grantedScopes,
          order: action.order ?? 0,
          visibility: action.visibility ?? 'all',
          pageModes: action.pageModes ?? ['view']
        });
      }
    }

    if (manifest.contributes.navigation) {
      for (const navigationItem of manifest.contributes.navigation) {
        if (target && navigationItem.location !== target) continue;

        resolved.push({
          installationId: inst.id,
          pluginId: inst.pluginId,
          pluginSlug: inst.plugin?.slug ?? undefined,
          version: manifest.version ?? '1.0.0',
          contributionId: navigationItem.id,
          target: navigationItem.location,
          renderMode: 'host',
          title: navigationItem.title,
          iconUrl: resolvePluginIconAssetUrl(artifactBaseUrl, navigationItem.icon?.resource),
          grantedScopes,
          page: navigationItem.page,
          order: navigationItem.order ?? 0,
          visibility: (navigationItem.visibility as 'all' | 'admin' | 'tutor' | 'learner') ?? 'all',
          pageModes: navigationItem.pageModes ?? ['view']
        });
      }
    }

    if (manifest.contributes.pages && (!target || target === 'plugin.page')) {
      if (!artifactBaseUrl) continue;

      for (const page of manifest.contributes.pages) {
        const rawEntry = manifest.runtime?.ui?.entrypoints?.[page.entrypoint];
        const entrypointPath = typeof rawEntry === 'string' ? rawEntry : rawEntry?.resource;
        if (!entrypointPath) continue;

        resolved.push({
          installationId: inst.id,
          pluginId: inst.pluginId,
          pluginSlug: inst.plugin?.slug ?? undefined,
          version: manifest.version ?? '1.0.0',
          contributionId: page.id,
          target: 'plugin.page',
          renderMode: 'custom',
          artifactUrl: `${artifactBaseUrl}/${normalizePluginEntrypointPath(entrypointPath)}`,
          grantedScopes,
          title: page.title ?? page.id,
          order: page.order ?? 0,
          visibility: page.visibility ?? 'all',
          pageModes: page.pageModes ?? ['view']
        });
      }
    }
  }

  return resolved
    .filter(
      (contribution) => !options.role || contribution.visibility === 'all' || contribution.visibility === options.role
    )
    .filter((contribution) => !options.pageMode || contribution.pageModes.includes(options.pageMode))
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.pluginId.localeCompare(right.pluginId) ||
        left.contributionId.localeCompare(right.contributionId)
    );
}
