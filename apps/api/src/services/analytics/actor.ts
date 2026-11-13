import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';

import { AppError, ErrorCodes } from '@api/utils/errors';
import type { AnalyticsActor } from './types';

/**
 * The actor for a public API or MCP credential: the key or OAuth-grant creator with their live org role. v1 has no
 * session orgRoles, so the current membership is read on every request and a creator who lost it is unauthorized.
 */
export async function resolveAnalyticsActorForCreator(orgId: string, profileId: string): Promise<AnalyticsActor> {
  const roleId = await getOrganizationMemberRoleId(orgId, profileId);
  if (roleId === null) {
    throw new AppError('You are no longer a member of this organization', ErrorCodes.UNAUTHORIZED, 401);
  }

  return { profileId, orgId, orgRoles: { [orgId]: roleId } };
}
