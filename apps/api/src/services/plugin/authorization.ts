import { AppError } from '@api/utils/errors';
import { getInstallationById, getInstallationGrants, getUserOrgRole } from '@cio/db/queries';
import type { TPluginInstallation } from '@cio/db/types';
import type { PluginPermissionScope } from '@cio/utils/validation/plugin';

export type PluginOrganizationRole = 'admin' | 'tutor' | 'student';
export type PluginResourceType = 'lesson' | 'course' | 'certificate' | 'organization';

export interface PluginResourceBinding {
  type: PluginResourceType;
  id: string;
}

export interface PluginAuthorizationContext {
  installation: TPluginInstallation;
  installationId: string;
  organizationId: string;
  actorId: string | null;
  organizationRole: PluginOrganizationRole | null;
  grantedScopes: PluginPermissionScope[];
  contributionTarget: string | null;
  resource: PluginResourceBinding | null;
}

export interface AuthorizePluginRequestInput {
  installationId: string;
  organizationId: string;
  actorId?: string | null;
  requiredScope?: PluginPermissionScope;
  tokenScopes?: readonly string[];
  contributionTarget?: string | null;
  allowedContributionTargets?: readonly string[];
  boundResource?: PluginResourceBinding | null;
  requestedResource?: PluginResourceBinding | null;
  requireBoundResource?: boolean;
  allowedRoles?: readonly PluginOrganizationRole[];
}

export function mapPluginOrganizationRole(roleId: number | null): PluginOrganizationRole | null {
  if (roleId === 1) return 'admin';
  if (roleId === 2) return 'tutor';
  if (roleId === 3) return 'student';

  return null;
}

export async function authorizePluginRequest(input: AuthorizePluginRequestInput): Promise<PluginAuthorizationContext> {
  const installation = await getInstallationById(input.installationId);
  if (
    !installation ||
    installation.ownerType !== 'organization' ||
    installation.organizationId !== input.organizationId
  ) {
    throw new AppError('Plugin installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active' || installation.orgApprovalStatus !== 'approved') {
    throw new AppError('Plugin installation is not active or approved', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const grants = await getInstallationGrants(input.installationId);
  const grantedScopes = grants.map((grant) => grant.scope) as PluginPermissionScope[];
  const grantedScopeSet = new Set<string>(grantedScopes);
  if (input.requiredScope && !grantedScopeSet.has(input.requiredScope)) {
    throw new AppError(`Permission ${input.requiredScope} is required`, 'PLUGIN_PERMISSION_DENIED', 403);
  }

  if (input.requiredScope && input.tokenScopes && !input.tokenScopes.includes(input.requiredScope)) {
    throw new AppError(`Access token lacks ${input.requiredScope}`, 'PLUGIN_PERMISSION_DENIED', 403);
  }

  let organizationRole: PluginOrganizationRole | null = null;
  if (input.actorId) {
    const roleId = await getUserOrgRole(input.organizationId, input.actorId);
    organizationRole = mapPluginOrganizationRole(roleId);
    if (!organizationRole) {
      throw new AppError('Plugin actor is not an active organization member', 'FORBIDDEN', 403);
    }
  }

  if (input.allowedRoles && (!organizationRole || !input.allowedRoles.includes(organizationRole))) {
    throw new AppError('Plugin actor does not have the required organization role', 'FORBIDDEN', 403);
  }

  if (
    input.allowedContributionTargets &&
    (!input.contributionTarget || !input.allowedContributionTargets.includes(input.contributionTarget))
  ) {
    throw new AppError('Operation is unavailable in this contribution surface', 'FORBIDDEN', 403);
  }

  if (input.requireBoundResource && !input.boundResource) {
    throw new AppError('Operation requires a host-bound resource', 'FORBIDDEN', 403);
  }

  if (
    input.requestedResource &&
    (!input.boundResource ||
      input.boundResource.type !== input.requestedResource.type ||
      input.boundResource.id !== input.requestedResource.id)
  ) {
    throw new AppError('Requested resource does not match the host-bound resource', 'FORBIDDEN', 403);
  }

  return {
    installation,
    installationId: installation.id,
    organizationId: input.organizationId,
    actorId: input.actorId ?? null,
    organizationRole,
    grantedScopes,
    contributionTarget: input.contributionTarget ?? null,
    resource: input.boundResource ?? null
  };
}

export async function requireOrganizationInstallation(
  installationId: string,
  organizationId: string
): Promise<TPluginInstallation> {
  const installation = await getInstallationById(installationId);
  if (!installation || installation.ownerType !== 'organization' || installation.organizationId !== organizationId) {
    throw new AppError('Plugin installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  return installation;
}
