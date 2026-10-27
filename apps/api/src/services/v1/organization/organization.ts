import type { TOrganization } from '@db/types';
import type { TPublicApiUpdateOrganization } from '@cio/utils/validation/public-api';

import { getOrganizationById } from '@cio/db/queries/organization';
import { updateOrg } from '@api/services/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertOrgAdmin } from '../shared';

function toPublicOrganization(organization: TOrganization) {
  return {
    id: organization.id,
    name: organization.name,
    siteName: organization.siteName,
    avatarUrl: organization.avatarUrl,
    theme: organization.theme
  };
}

/** Org admins only, like every other `/public-api/v1/organization` route. */
export async function getPublicApiOrganizationService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  return toPublicOrganization(organization);
}

/**
 * Mirrors `PUT /organization` (`orgAdminMiddleware`, `ZUpdateOrganization`) and calls the same `updateOrg`.
 * Omitted fields keep their stored values.
 */
export async function updatePublicApiOrganizationService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiUpdateOrganization
) {
  await assertOrgAdmin(orgId, actorId);

  const organization = await updateOrg(orgId, payload);

  return toPublicOrganization(organization);
}
