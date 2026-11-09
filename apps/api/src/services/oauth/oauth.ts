import type { TOrganizationApiKey, TPlan } from '@cio/db/types';
import {
  InvalidOAuthTokenError,
  isTrustedOAuthClient,
  PUBLIC_API_RESOURCE,
  verifyOAuthAccessToken,
  type OAuthResourceKind
} from '@cio/db/auth';
import {
  findActiveOAuthConsent,
  getOAuthOrganizationSelection,
  getOrCreateOAuthGrantKey,
  isActiveOrganizationAdmin,
  listOAuthConnectedApps,
  listOAuthEligibleOrganizations,
  revokeOAuthConsent,
  revokeUserOAuthGrantsInOrganization,
  saveOAuthOrganizationSelection
} from '@cio/db/queries/auth';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { canUsePublicApi } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';
import { refreshOrgHasWebhookEndpoints } from '@cio/core/services/webhook/endpoint-cache';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertPublicApiAllowed } from '@api/services/organization/automation-usage';
import { getConnectedAppKind } from './clients';

export type TOAuthGrant = {
  key: TOrganizationApiKey;
  clientId: string;
  /** Plan checked for public API grants; null for grants that never touch the public API. */
  planName: TPlan | null;
};

/**
 * Admin workspaces the user can pick for an OAuth flow. For the public API resource, a workspace whose plan
 * excludes the public API is returned with `eligible: false` and `reason: 'plan'`.
 */
export async function listOAuthOrganizationsService(userId: string, resource?: string) {
  const organizations = await listOAuthEligibleOrganizations(userId);
  const needsPublicApi = resource === PUBLIC_API_RESOURCE;
  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
  const plans = needsPublicApi
    ? await Promise.all(organizations.map((organization) => getActiveOrganizationPlan(organization.id)))
    : [];

  return organizations.map((organization, index) => {
    const plan = plans[index];
    const eligible = !needsPublicApi || canUsePublicApi(plan?.planName, isSelfHosted);
    const reason = eligible ? null : ('plan' as const);

    return { ...organization, eligible, reason };
  });
}

export async function getSelectedOAuthOrganizationService(sessionId: string, userId: string) {
  const organizationId = await getOAuthOrganizationSelection(sessionId);

  if (!organizationId) return null;

  const organizations = await listOAuthEligibleOrganizations(userId);

  return organizations.find((organization) => organization.id === organizationId) ?? null;
}

export async function selectOAuthOrganizationService(sessionId: string, userId: string, organizationId: string) {
  const isAdmin = await isActiveOrganizationAdmin(userId, organizationId);

  if (!isAdmin) {
    throw new AppError(
      'Only organization admins can connect an integration',
      ErrorCodes.OAUTH_ORGANIZATION_NOT_ALLOWED,
      403
    );
  }

  await saveOAuthOrganizationSelection(sessionId, organizationId);
}

export async function listOAuthConnectedAppsService(organizationId: string) {
  const apps = await listOAuthConnectedApps(organizationId);

  return apps.map((app) => {
    const kind = getConnectedAppKind(app.clientId);
    const lastUsedAt = app.lastUsedAt ? new Date(app.lastUsedAt).toISOString() : null;

    return {
      ...app,
      kind,
      lastUsedAt
    };
  });
}

export async function revokeOAuthConnectedAppService(organizationId: string, consentId: string) {
  const revoked = await revokeOAuthConsent(consentId, organizationId);

  if (!revoked) {
    throw new AppError('Connected app not found', ErrorCodes.OAUTH_CONNECTED_APP_NOT_FOUND, 404);
  }

  await refreshOrgHasWebhookEndpoints(organizationId);
}

export function getOAuthClientTrustService(clientId: string) {
  const trusted = isTrustedOAuthClient(clientId);
  const kind = getConnectedAppKind(clientId);

  return { clientId, trusted, kind };
}

/**
 * Resolves a bearer OAuth access token to the key that meters its grant.
 * The token must have been issued for `resource`; MCP tokens are never accepted for the public API
 * unless the request was dispatched by this process on behalf of an authenticated MCP call.
 */
export async function authenticateOAuthAccessTokenService(
  token: string,
  resource: OAuthResourceKind
): Promise<TOAuthGrant> {
  const claims = await verifyOAuthAccessToken(token, resource).catch((error: unknown) => {
    if (error instanceof InvalidOAuthTokenError) {
      throw new AppError('Invalid or expired access token', ErrorCodes.UNAUTHORIZED, 401);
    }

    throw error;
  });

  const [isAdmin, consent] = await Promise.all([
    isActiveOrganizationAdmin(claims.userId, claims.organizationId),
    findActiveOAuthConsent(claims.userId, claims.clientId, claims.organizationId)
  ]);

  if (!isAdmin) {
    await revokeUserOAuthGrantsInOrganization(claims.userId, claims.organizationId);
  }

  const consentCreatedAtSeconds = consent ? Math.floor(consent.createdAt.getTime() / 1000) : 0;
  const isIssuedForThisGrant = claims.issuedAt >= consentCreatedAtSeconds;

  if (!isAdmin || !consent || !isIssuedForThisGrant) {
    throw new AppError('Access has been revoked', ErrorCodes.UNAUTHORIZED, 401);
  }

  const planName = claims.kind === 'api' ? await assertPublicApiAllowed(claims.organizationId) : null;

  const grantKey = await getOrCreateOAuthGrantKey({
    consentId: consent.id,
    organizationId: claims.organizationId,
    userId: claims.userId,
    type: claims.kind,
    label: 'OAuth connection'
  });

  return { key: { ...grantKey, scopes: claims.scopes }, clientId: claims.clientId, planName };
}
