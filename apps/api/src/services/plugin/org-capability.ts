import {
  getOrgEnabledCapabilityIds,
  isOrgCapabilityEnabled,
  upsertOrgCapability
} from '@cio/db/queries/plugins/org-capability';
import { configuredPlugins } from '@cio/plugins';
import { resolvePluginCapabilities } from '@cio/sdk';
import { AppError, ErrorCodes } from '@api/utils/errors';

const configuredCapabilities = resolvePluginCapabilities(configuredPlugins);
const configuredCapabilitiesById = new Map(
  configuredCapabilities.map((capability) => [capability.id, capability] as const)
);

export async function assertOrgCapabilityEnabled(orgId: string, capabilityId: string): Promise<void> {
  if (!orgId) {
    throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (!configuredCapabilitiesById.has(capabilityId)) {
    throw new AppError(
      `Capability "${capabilityId}" is not enabled for this organization`,
      ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
      403
    );
  }

  const isEnabled = await isOrgCapabilityEnabled(orgId, capabilityId);

  if (!isEnabled) {
    throw new AppError(
      `Capability "${capabilityId}" is not enabled for this organization`,
      ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
      403
    );
  }
}

export async function listOrgCapabilitiesService(orgId: string): Promise<string[]> {
  if (!orgId) {
    throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const enabledDbIds = await getOrgEnabledCapabilityIds(orgId);

  return enabledDbIds.filter((capabilityId) => configuredCapabilitiesById.has(capabilityId));
}

export async function setOrgCapabilityService(
  orgId: string,
  capabilityId: string,
  isEnabled: boolean
): Promise<{ capabilityId: string; isEnabled: boolean }> {
  if (!orgId) {
    throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const configuredCapability = configuredCapabilitiesById.get(capabilityId);

  if (!configuredCapability) {
    throw new AppError(`Capability with id "${capabilityId}" was not found`, ErrorCodes.NOT_FOUND, 404);
  }

  const updatedCapability = await upsertOrgCapability(orgId, capabilityId, isEnabled);

  return {
    capabilityId: updatedCapability.capabilityId,
    isEnabled: updatedCapability.isEnabled
  };
}
