import type {
  TPublicApiTeamMemberParam,
  TPublicApiTeamQuery,
  TPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';

import { getOrgTeam, updateTeamMemberRole } from '@api/services/organization';
import { updateUser } from '@api/services/account/profile';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor, assertMemberHasJoined, assertOrgAdmin, paginateInMemory } from './shared';

type TOrgTeamMember = Awaited<ReturnType<typeof getOrgTeam>>[number];

function toPublicTeamMember(member: TOrgTeamMember) {
  return {
    id: member.id,
    profileId: member.profileId ?? null,
    name: member.fullname,
    email: member.email,
    roleId: member.roleId,
    verified: member.verified ?? false
  };
}

async function getTeamMember(orgId: string, memberId: number) {
  const team = await getOrgTeam(orgId);
  const member = team.find((teamMember) => teamMember.id === memberId);
  if (!member) {
    throw new AppError('Team member not found', ErrorCodes.NOT_FOUND, 404);
  }

  return member;
}

export async function listTeamService(orgId: string, actorId: string | null, query: TPublicApiTeamQuery) {
  await assertOrgAdmin(orgId, actorId);

  const team = await getOrgTeam(orgId);
  const { items, pagination } = paginateInMemory(team, query);

  return { items: items.map(toPublicTeamMember), pagination };
}

export async function getTeamMemberService(orgId: string, actorId: string | null, params: TPublicApiTeamMemberParam) {
  await assertOrgAdmin(orgId, actorId);

  return toPublicTeamMember(await getTeamMember(orgId, params.memberId));
}

/**
 * Changes a team member's role, name, or both. The rename precondition is checked before the role write, so a request
 * that cannot be fully applied changes nothing. The role is written first, then the name.
 */
export async function updateTeamMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiTeamMemberParam,
  payload: TPublicApiUpdateTeamMember
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  const member = await getTeamMember(orgId, params.memberId);

  if (payload.name !== undefined) {
    assertMemberHasJoined(member.profileId);
  }

  if (payload.roleId !== undefined) {
    await updateTeamMemberRole(orgId, params.memberId, payload.roleId, actorId);
  }

  if (payload.name !== undefined && member.profileId) {
    await updateUser(member.profileId, { fullname: payload.name });
  }

  return toPublicTeamMember(await getTeamMember(orgId, params.memberId));
}
