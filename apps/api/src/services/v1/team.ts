import type {
  TPublicApiTeamMemberParam,
  TPublicApiTeamQuery,
  TPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';

import { db } from '@cio/db/drizzle';
import { updateProfile } from '@cio/db/queries/auth';
import { getOrgTeam } from '@api/services/organization';
import { applyTeamMemberRoleChange, reconcileAfterTeamRoleChange } from '@api/services/organization/team-role';
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

  const { roleId, name } = payload;
  const profileId = member.profileId;

  const appliedRole = await db.transaction(async (tx) => {
    const applied =
      roleId !== undefined ? await applyTeamMemberRoleChange(orgId, params.memberId, roleId, actorId, tx) : null;

    if (name !== undefined && profileId) {
      const updatedProfile = await updateProfile(profileId, { fullname: name }, tx);
      if (!updatedProfile) {
        throw new AppError('Team member profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
      }
    }

    return applied;
  });

  if (appliedRole) {
    await reconcileAfterTeamRoleChange(orgId, appliedRole, actorId);
  }

  return toPublicTeamMember(await getTeamMember(orgId, params.memberId));
}
