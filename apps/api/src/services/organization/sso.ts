import { AppError, ErrorCodes } from '@api/utils/errors';
import type {
  TCreateSsoConnection,
  TUpdateSsoConnection,
  TUpdateSsoPolicy
} from '@cio/utils/validation/organization/sso';
import {
  createOrganizationAuthPolicy,
  createOrganizationSsoConfig,
  deleteOrganizationSsoConfig,
  getOrganizationAuthPolicy,
  getOrganizationSsoConfig,
  updateOrganizationAuthPolicy,
  updateOrganizationSsoConfig
} from '@cio/db/queries/organization/sso';

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { getOrganizationPlanStatus } from '@cio/db/queries/organization/organization';

// Check if organization has Enterprise plan
async function assertEnterprisePlan(orgId: string): Promise<void> {
  const plans = await getOrganizationPlanStatus(orgId);
  const hasEnterprise = plans.some(
    (p: { planName: string | null; isActive: boolean | null }) => p.planName === 'ENTERPRISE' && p.isActive
  );

  if (!hasEnterprise) {
    throw new AppError('SSO requires Enterprise plan', ErrorCodes.UPGRADE_REQUIRED, 403);
  }
}

// Generate a unique provider ID for Better Auth
function generateProviderId(orgId: string, provider: string): string {
  return `org-${orgId.slice(0, 8)}-${provider.toLowerCase()}`;
}

function getSsoRegistrationErrorMessage(error: unknown, issuer?: string): string {
  const base = 'Failed to register SSO provider. Please check your OIDC configuration.';
  const err = error as {
    body?: { message?: string; code?: string };
    message?: string;
  } | null;
  const code = err?.body?.code;

  if (code === 'discovery_not_found' && issuer) {
    const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    return `${base} Discovery endpoint not found. Check that the Issuer URL is correct and supports OIDC (e.g. https://accounts.google.com for Google). Expected: ${discoveryUrl}`;
  }

  return base;
}

// Create SSO connection
export async function createSsoConnection(
  orgId: string,
  data: TCreateSsoConnection,
  createdByProfileId: string,
  authApi: { registerSSOProvider: (args: unknown) => Promise<unknown> },
  requestHeaders?: Headers
) {
  // Check Enterprise plan
  await assertEnterprisePlan(orgId);

  // Check if org already has SSO config
  const existing = await getOrganizationSsoConfig(orgId);
  if (existing) {
    throw new AppError('Organization already has an SSO connection', ErrorCodes.CONFLICT, 409);
  }

  const providerId = generateProviderId(orgId, data.provider);

  return db.transaction(async () => {
    // Register with Better Auth (requires session cookies via headers)
    try {
      await authApi.registerSSOProvider({
        body: {
          providerId,
          issuer: data.issuer,
          domain: data.domain,
          oidcConfig: {
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            scopes: data.scopes.split(' '),
            mapping: {
              id: 'sub',
              email: 'email',
              emailVerified: 'email_verified',
              name: 'name',
              image: 'picture'
            }
          }
        },
        ...(requestHeaders && { headers: requestHeaders })
      });
    } catch (error) {
      console.error('Failed to register SSO provider with Better Auth:', error);
      throw new AppError(getSsoRegistrationErrorMessage(error, data.issuer), ErrorCodes.SSO_REGISTRATION_FAILED, 400);
    }

    // Create our config record
    const config = await createOrganizationSsoConfig({
      organizationId: orgId,
      betterAuthProviderId: providerId,
      provider: data.provider,
      displayName: data.displayName,
      domain: data.domain.toLowerCase(),
      isActive: false, // Requires activation after testing
      createdByProfileId
    });

    // Create default policy
    await createOrganizationAuthPolicy({
      organizationId: orgId,
      forceSso: false,
      autoJoinSsoDomains: false,
      breakGlassEnabled: true,
      defaultRoleId: ROLE.STUDENT,
      roleMapping: {}
    });

    return config;
  });
}

// Get SSO connection
export async function getSsoConnection(orgId: string) {
  const config = await getOrganizationSsoConfig(orgId);
  if (!config) {
    return null;
  }

  const policy = await getOrganizationAuthPolicy(orgId);

  return {
    config,
    policy
  };
}

// Update SSO connection
export async function updateSsoConnection(orgId: string, data: TUpdateSsoConnection, updatedByProfileId: string) {
  const config = await getOrganizationSsoConfig(orgId);
  if (!config) {
    throw new AppError('SSO connection not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Note: OIDC config updates (clientId, issuer, etc.) would require
  // updating Better Auth's stored provider. For now, we only allow
  // updating our metadata (displayName, isActive).

  const updated = await updateOrganizationSsoConfig(orgId, {
    ...data,
    updatedByProfileId
  });

  return updated;
}

// Update SSO policy
export async function updateSsoPolicy(orgId: string, data: TUpdateSsoPolicy) {
  const config = await getOrganizationSsoConfig(orgId);
  if (!config) {
    throw new AppError('SSO connection required before updating policy', ErrorCodes.NOT_FOUND, 404);
  }

  // Validate: forceSso requires active connection
  if (data.forceSso === true && !config.isActive) {
    throw new AppError('Cannot enable Force SSO without an active connection', ErrorCodes.VALIDATION_ERROR, 400);
  }

  let policy = await getOrganizationAuthPolicy(orgId);

  if (policy) {
    policy = await updateOrganizationAuthPolicy(orgId, data);
  } else {
    policy = await createOrganizationAuthPolicy({
      organizationId: orgId,
      forceSso: data.forceSso ?? false,
      autoJoinSsoDomains: data.autoJoinSsoDomains ?? false,
      breakGlassEnabled: data.breakGlassEnabled ?? true,
      defaultRoleId: data.defaultRoleId ?? ROLE.STUDENT,
      roleMapping: data.roleMapping ?? {}
    });
  }

  return policy;
}

// Delete SSO connection
export async function deleteSsoConnection(
  orgId: string,
  authApi: { deleteSSOProvider: (args: unknown) => Promise<unknown> }
) {
  const config = await getOrganizationSsoConfig(orgId);
  if (!config) {
    throw new AppError('SSO connection not found', ErrorCodes.NOT_FOUND, 404);
  }

  return db.transaction(async () => {
    // Delete from Better Auth
    try {
      await authApi.deleteSSOProvider({
        body: { providerId: config.betterAuthProviderId }
      });
    } catch (error) {
      console.error('Failed to delete SSO provider from Better Auth:', error);
      // Continue to delete our record even if Better Auth fails
    }

    // Delete our records
    await deleteOrganizationSsoConfig(orgId);

    return { success: true };
  });
}

// Activate SSO connection
export async function activateSsoConnection(orgId: string, updatedByProfileId: string) {
  const config = await getOrganizationSsoConfig(orgId);
  if (!config) {
    throw new AppError('SSO connection not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Could add a test connection check here before activating

  const updated = await updateOrganizationSsoConfig(orgId, {
    isActive: true,
    updatedByProfileId
  });

  return updated;
}
