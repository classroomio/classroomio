import { API_SERVER_URL } from '@api/constants';
import { AppError } from '@api/utils/errors';
import {
  createInstallation,
  getInstallationById,
  getOrganizationInstallation,
  getPluginById,
  getPluginVersion,
  getUserInstallation,
  listOrganizationInstallations,
  recordPluginAuditEvent,
  replaceInstallationGrants,
  updateInstallationSettings as updateInstallationSettingsQuery,
  updateInstallationStatus as updateInstallationStatusQuery,
  updateOrgApprovalStatus as updateOrgApprovalStatusQuery,
  getInstallationGrants
} from '@cio/db/queries/plugin';
import type {
  TNewPluginInstallation,
  TPluginGrant,
  TPluginInstallation,
  TPluginInstallationStatus,
  TPluginOrgApprovalStatus,
  TPluginOwnerType
} from '@cio/db/types';

export interface InstallPluginParams {
  pluginId: string;
  version: string;
  ownerType: TPluginOwnerType;
  organizationId?: string;
  userId?: string;
  installedByProfileId: string;
  settings?: Record<string, unknown>;
}

export async function installPlugin(params: InstallPluginParams): Promise<{
  installation: TPluginInstallation;
  grants: TPluginGrant[];
}> {
  const pluginRecord = await getPluginById(params.pluginId);
  if (!pluginRecord) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }

  const versionRecord = await getPluginVersion(params.pluginId, params.version);
  if (!versionRecord) {
    throw new AppError('Plugin version not found', 'PLUGIN_VERSION_NOT_FOUND', 404);
  }

  if (params.ownerType === 'organization') {
    if (!params.organizationId) {
      throw new AppError('Organization ID is required for organization installations', 'INVALID_PARAMS', 400);
    }

    const existingInstallation = await getOrganizationInstallation(params.organizationId, params.pluginId);
    if (existingInstallation && existingInstallation.status !== 'uninstalled') {
      throw new AppError('Plugin is already installed for this organization', 'PLUGIN_ALREADY_INSTALLED', 409);
    }
  } else {
    if (!params.userId) {
      throw new AppError('User ID is required for user installations', 'INVALID_PARAMS', 400);
    }

    const existingUserInstallation = await getUserInstallation(params.userId, params.pluginId);
    if (existingUserInstallation && existingUserInstallation.status !== 'uninstalled') {
      throw new AppError('Plugin is already installed for this user', 'PLUGIN_ALREADY_INSTALLED', 409);
    }
  }

  const initialSettings = params.settings ?? {};
  const newInstallationData: TNewPluginInstallation = {
    pluginId: params.pluginId,
    pluginVersionId: versionRecord.id,
    ownerType: params.ownerType,
    organizationId: params.organizationId,
    userId: params.userId,
    status: 'active',
    orgApprovalStatus: 'approved',
    settings: initialSettings,
    installedByProfileId: params.installedByProfileId
  };

  const installation = await createInstallation(newInstallationData);

  const manifest = versionRecord.manifest;
  const requiredScopes = manifest.permissions?.required ?? [];

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

export async function listOrgPlugins(
  organizationId: string,
  options: { activeOnly?: boolean } = {}
): Promise<TPluginInstallation[]> {
  return listOrganizationInstallations(organizationId, options);
}

export async function getInstallation(installationId: string): Promise<{
  installation: TPluginInstallation;
  grants: TPluginGrant[];
}> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Plugin installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  const grants = await getInstallationGrants(installationId);

  return {
    installation,
    grants
  };
}

export async function changeInstallationStatus(
  installationId: string,
  status: TPluginInstallationStatus,
  actorProfileId?: string
): Promise<TPluginInstallation> {
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

export async function changeInstallationSettings(
  installationId: string,
  settings: Record<string, unknown>,
  actorProfileId?: string
): Promise<TPluginInstallation> {
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
  approval: TPluginOrgApprovalStatus,
  actorProfileId?: string
): Promise<TPluginInstallation> {
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
  version: string;
  contributionId: string;
  target: string;
  renderMode: 'host' | 'custom';
  artifactUrl?: string;
  title: string;
  label?: string;
  icon?: string;
  actionType?: 'openUrl' | 'command' | 'dialog';
  urlTemplate?: string;
  command?: string;
}

export async function resolveOrgContributions(
  organizationId: string,
  target?: string
): Promise<ResolvedPluginContribution[]> {
  const installations = await listOrganizationInstallations(organizationId);
  const activeApproved = installations.filter(
    (inst) => inst.status === 'active' && inst.orgApprovalStatus === 'approved'
  );

  const resolved: ResolvedPluginContribution[] = [];

  for (const inst of activeApproved) {
    const manifest = inst.manifest as {
      version?: string;
      contributes?: {
        slots?: Array<{
          id: string;
          target: string;
          renderMode?: 'custom' | 'host';
          entrypoint?: string;
          title?: string;
        }>;
        actions?: Array<{
          id: string;
          target: string;
          renderMode?: 'host' | 'custom';
          entrypoint?: string;
          label?: string;
          icon?: string;
          actionType?: 'openUrl' | 'command' | 'dialog';
          urlTemplate?: string;
          command?: string;
        }>;
      };
      runtime?: {
        ui?: {
          entrypoints?: Record<string, string | { renderMode?: string; resource: string }>;
        };
      };
    } | null;

    if (!manifest?.contributes) continue;

    if (manifest.contributes.slots) {
      for (const slot of manifest.contributes.slots) {
        if (target && slot.target !== target) continue;

        const renderMode = slot.renderMode ?? 'custom';
        let artifactUrl: string | undefined = undefined;

        if (renderMode === 'custom' && slot.entrypoint && manifest.runtime?.ui?.entrypoints) {
          const rawEntry = manifest.runtime.ui.entrypoints[slot.entrypoint];
          const entrypointPath = typeof rawEntry === 'string' ? rawEntry : rawEntry?.resource;
          if (entrypointPath) {
            artifactUrl = `${API_SERVER_URL}/plugins/assets/${inst.pluginId}/${entrypointPath}`;
          }
        }

        resolved.push({
          installationId: inst.id,
          pluginId: inst.pluginId,
          version: manifest.version ?? '1.0.0',
          contributionId: slot.id,
          target: slot.target,
          renderMode,
          artifactUrl,
          title: slot.title ?? slot.id
        });
      }
    }

    if (manifest.contributes.actions) {
      for (const action of manifest.contributes.actions) {
        if (target && action.target !== target) continue;

        const renderMode = action.renderMode ?? 'host';
        let artifactUrl: string | undefined = undefined;

        if (renderMode === 'custom' && action.entrypoint && manifest.runtime?.ui?.entrypoints) {
          const rawEntry = manifest.runtime.ui.entrypoints[action.entrypoint];
          const entrypointPath = typeof rawEntry === 'string' ? rawEntry : rawEntry?.resource;
          if (entrypointPath) {
            artifactUrl = `${API_SERVER_URL}/plugins/assets/${inst.pluginId}/${entrypointPath}`;
          }
        }

        resolved.push({
          installationId: inst.id,
          pluginId: inst.pluginId,
          version: manifest.version ?? '1.0.0',
          contributionId: action.id,
          target: action.target,
          renderMode,
          artifactUrl,
          title: action.label ?? action.id,
          label: action.label,
          icon: action.icon,
          actionType: action.actionType,
          urlTemplate: action.urlTemplate,
          command: action.command
        });
      }
    }
  }

  return resolved;
}
