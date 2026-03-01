import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getOrganizationAuthPolicy,
  getOrganizationSsoConfig,
  getOrganizationSsoConfigByDomain
} from '@cio/db/queries/organization/sso';

// Extract domain from email
function getDomainFromEmail(email: string): string {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) {
    throw new AppError('Invalid email format', ErrorCodes.VALIDATION_ERROR, 400);
  }
  return parts[1];
}

// SSO Discovery result
interface SsoDiscoveryResult {
  ssoRequired: boolean;
  ssoAvailable: boolean;
  redirectUrl: string | null;
  allowPassword: boolean;
  providerName: string | null;
  providerId: string | null;
}

// Discover SSO for email
export async function discoverSso(email: string): Promise<SsoDiscoveryResult> {
  const domain = getDomainFromEmail(email);

  // Find SSO config by domain
  const config = await getOrganizationSsoConfigByDomain(domain);

  if (!config || !config.isActive) {
    // No SSO found for this domain
    return {
      ssoRequired: false,
      ssoAvailable: false,
      redirectUrl: null,
      allowPassword: true,
      providerName: null,
      providerId: null
    };
  }

  // Get policy
  const policy = await getOrganizationAuthPolicy(config.organizationId);

  // Build Better Auth SSO URL
  // Note: Better Auth handles the actual flow, we just provide the entry point
  const redirectUrl = `/api/auth/sso/authorize/${config.betterAuthProviderId}`;

  return {
    ssoRequired: policy?.forceSso ?? false,
    ssoAvailable: true,
    redirectUrl,
    allowPassword: !(policy?.forceSso ?? false),
    providerName: config.displayName,
    providerId: config.betterAuthProviderId
  };
}

// Check if user can use password login for org
export async function canUsePasswordLogin(orgId: string, isBreakGlassUser: boolean = false): Promise<boolean> {
  const policy = await getOrganizationAuthPolicy(orgId);

  if (!policy) {
    return true; // No policy = no restrictions
  }

  // If Force SSO is not enabled, password is allowed
  if (!policy.forceSso) {
    return true;
  }

  // Force SSO is enabled - check break glass
  if (isBreakGlassUser && policy.breakGlassEnabled) {
    return true;
  }

  // Force SSO active, not break glass
  return false;
}

// Get SSO info for org (used in login page when org context is known)
export async function getOrgSsoInfo(orgId: string) {
  const config = await getOrganizationSsoConfig(orgId);

  if (!config || !config.isActive) {
    return {
      hasSso: false,
      ssoRequired: false,
      redirectUrl: null,
      providerName: null,
      providerId: null
    };
  }

  const policy = await getOrganizationAuthPolicy(orgId);

  return {
    hasSso: true,
    ssoRequired: policy?.forceSso ?? false,
    redirectUrl: `/api/auth/sso/authorize/${config.betterAuthProviderId}`,
    providerName: config.displayName,
    providerId: config.betterAuthProviderId
  };
}

// JIT provisioning: Get role mapping for user
export async function getSsoRoleMapping(orgId: string, groups: string[]): Promise<number> {
  const policy = await getOrganizationAuthPolicy(orgId);

  if (!policy) {
    return 3; // Default to STUDENT
  }

  const roleMapping = policy.roleMapping as Record<string, number> | null;

  if (!roleMapping) {
    return policy.defaultRoleId ?? 3;
  }

  // Check each group for a mapping
  for (const group of groups) {
    const mappedRole = roleMapping[group];
    if (mappedRole) {
      return mappedRole;
    }
  }

  return policy.defaultRoleId ?? 3;
}
