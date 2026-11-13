import { getProfileById } from '@cio/db/queries/auth';
import { getOrganizationById } from '@cio/db/queries/organization';

import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor } from '../shared';

export async function getMeService(orgId: string, actorId: string | null, principal: TAutomationPrincipal) {
  assertAutomationActor(actorId);

  const [organization, actor] = await Promise.all([getOrganizationById(orgId), getProfileById(actorId)]);

  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const { automationKey, oauthClientId } = principal;
  const isOAuth = Boolean(automationKey.oauthConsentId);
  const organizationData = {
    id: organization.id,
    name: organization.name,
    siteName: organization.siteName,
    avatarUrl: organization.avatarUrl
  };
  const connectionKind = isOAuth ? ('oauth' as const) : ('api_key' as const);
  const connectionId = automationKey.oauthConsentId ?? automationKey.id;
  const connectionScopes = automationKey.scopes ?? [];
  const connectionData = {
    kind: connectionKind,
    id: connectionId,
    clientId: oauthClientId,
    scopes: connectionScopes
  };
  const actorFullname = actor?.fullname ?? null;
  const actorEmail = actor?.email ?? null;
  const actorData = {
    profileId: actorId,
    fullname: actorFullname,
    email: actorEmail
  };

  return {
    organization: organizationData,
    connection: connectionData,
    actor: actorData
  };
}
