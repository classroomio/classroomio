import { getOrgCapabilities, upsertOrgCapability } from '@cio/db/queries/plugins/org-capability';
import { configuredPlugins } from '@cio/plugins';
import { resolvePluginCapabilities, type OrgCapabilitySummary } from '@cio/sdk';
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

  const orgCapabilities = await getOrgCapabilities(orgId);
  const isEnabled = orgCapabilities.some(
    (capability) => capability.capabilityId === capabilityId && capability.isEnabled
  );

  if (!isEnabled) {
    throw new AppError(
      `Capability "${capabilityId}" is not enabled for this organization`,
      ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
      403
    );
  }
}

export async function listOrgCapabilitiesService(orgId: string): Promise<OrgCapabilitySummary[]> {
  if (!orgId) {
    throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const orgCapabilities = await getOrgCapabilities(orgId);
  const orgCapabilitiesById = new Map(
    orgCapabilities.map((capability) => [capability.capabilityId, capability] as const)
  );

  return configuredCapabilities.map((capability) => {
    const orgCapability = orgCapabilitiesById.get(capability.id);

    return {
      ...capability,
      isEnabled: orgCapability?.isEnabled ?? false,
      updatedAt: orgCapability?.updatedAt ?? null
    };
  });
}

export async function setOrgCapabilityService(
  orgId: string,
  capabilityId: string,
  isEnabled: boolean
): Promise<OrgCapabilitySummary> {
  if (!orgId) {
    throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const configuredCapability = configuredCapabilitiesById.get(capabilityId);

  if (!configuredCapability) {
    throw new AppError(`Capability with id "${capabilityId}" was not found`, ErrorCodes.NOT_FOUND, 404);
  }

  const updatedCapability = await upsertOrgCapability(orgId, capabilityId, isEnabled);

  return {
    ...configuredCapability,
    isEnabled: updatedCapability.isEnabled,
    updatedAt: updatedCapability.updatedAt ?? null
  };
}
