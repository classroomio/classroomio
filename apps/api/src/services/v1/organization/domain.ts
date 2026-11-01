import type { TPublicApiConnectCustomDomain, TPublicApiUpdateDomain } from '@cio/utils/validation/public-api';
import type { TOrganization } from '@cio/db/types';

import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getOrganizationById } from '@cio/db/queries/organization';
import { updateOrg } from '@api/services/organization';
import { connectOrgDomain, refreshOrgDomain, removeOrgDomain } from '@api/services/org/domain';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertOrgAdmin } from '@api/services/v1/shared';

function toDomainResponse(org: TOrganization) {
  return {
    siteName: org.siteName,
    siteUrl: getDashboardBaseUrl(org),
    favicon: org.favicon || null,
    customDomain: org.customDomain
      ? { hostname: org.customDomain, verified: Boolean(org.isCustomDomainVerified) }
      : null
  };
}

/** Mirrors Settings → Domains (`orgAdminMiddleware`): the actor must be an org admin. */
export async function getDomainService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  const org = await getOrganizationById(orgId);
  if (!org) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  return toDomainResponse(org);
}

export async function updateDomainService(orgId: string, actorId: string | null, payload: TPublicApiUpdateDomain) {
  await assertOrgAdmin(orgId, actorId);

  const org = await updateOrg(orgId, payload);

  return toDomainResponse(org);
}

export async function connectCustomDomainService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiConnectCustomDomain
) {
  await assertOrgAdmin(orgId, actorId);

  return connectOrgDomain(orgId, payload.hostname);
}

export async function refreshCustomDomainService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  return refreshOrgDomain(orgId);
}

export async function removeCustomDomainService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  return removeOrgDomain(orgId);
}
