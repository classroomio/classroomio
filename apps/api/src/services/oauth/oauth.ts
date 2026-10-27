import type { TOrganizationApiKey } from '@cio/db/types';
import { verifyOAuthAccessToken } from '@cio/db/auth';
import {
  findActiveOAuthConsentId,
  getOAuthOrganizationSelection,
  getOrCreateOAuthGrantKey,
  isActiveOrganizationAdmin,
  listOAuthConnectedApps,
  listOAuthEligibleOrganizations,
  revokeOAuthConsent,
  revokeUserOAuthGrantsInOrganization,
  saveOAuthOrganizationSelection
} from '@cio/db/queries/auth';

import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listOAuthOrganizationsService(userId: string) {
  return listOAuthEligibleOrganizations(userId);
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

  return apps.map((app) => ({
    ...app,
    lastUsedAt: app.lastUsedAt ? new Date(app.lastUsedAt).toISOString() : null
  }));
}

export async function revokeOAuthConnectedAppService(organizationId: string, consentId: string) {
  const revoked = await revokeOAuthConsent(consentId, organizationId);

  if (!revoked) {
    throw new AppError('Connected app not found', ErrorCodes.OAUTH_CONNECTED_APP_NOT_FOUND, 404);
  }
}

export async function authenticateOAuthAccessTokenService(token: string): Promise<TOrganizationApiKey> {
  const claims = await verifyOAuthAccessToken(token).catch(() => null);

  if (!claims) {
    throw new AppError('Invalid or expired access token', ErrorCodes.UNAUTHORIZED, 401);
  }

  const [isAdmin, consentId] = await Promise.all([
    isActiveOrganizationAdmin(claims.userId, claims.organizationId),
    findActiveOAuthConsentId(claims.userId, claims.clientId, claims.organizationId)
  ]);

  if (!isAdmin) {
    await revokeUserOAuthGrantsInOrganization(claims.userId, claims.organizationId);
  }

  if (!isAdmin || !consentId) {
    throw new AppError('Access has been revoked', ErrorCodes.UNAUTHORIZED, 401);
  }

  const grantKey = await getOrCreateOAuthGrantKey({
    consentId,
    organizationId: claims.organizationId,
    userId: claims.userId,
    type: claims.kind,
    label: 'OAuth connection'
  });

  return { ...grantKey, scopes: claims.scopes };
}
