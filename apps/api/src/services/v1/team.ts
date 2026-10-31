import type {
  TPublicApiTeamMemberParam,
  TPublicApiTeamQuery,
  TPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';

import { db } from '@cio/db/drizzle';
import { applyProfileUpdate } from '@api/services/account/profile';
import { sendProfileUpdatedEmail } from '@api/services/account/profile-updated-email';
import { getOrgTeam } from '@api/services/organization';
import { applyTeamMemberRoleChange, reconcileAfterTeamRoleChange } from '@api/services/organization/team-role';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertAutomationActor,
  assertMemberHasJoined,
  assertOrgAdmin,
  paginateInMemory,
  toProfileUpdate
} from './shared';

type TOrgTeamMember = Awaited<ReturnType<typeof getOrgTeam>>[number];

function toPublicTeamMember(member: TOrgTeamMember) {
  return {
    id: member.id,
    profileId: member.profileId ?? null,
    name: member.fullname,
    username: member.username,
    email: member.email,
    avatarUrl: member.avatarUrl,
    locale: member.locale,
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
  const profileUpdate = toProfileUpdate(payload);

  if (profileUpdate) {
    assertMemberHasJoined(member.profileId, payload);
  }

  const { roleId } = payload;
  const profileId = member.profileId;

  const { appliedRole, appliedProfile } = await db.transaction(async (tx) => {
    const appliedRole =
      roleId !== undefined ? await applyTeamMemberRoleChange(orgId, params.memberId, roleId, actorId, tx) : null;
    const appliedProfile = profileUpdate && profileId ? await applyProfileUpdate(profileId, profileUpdate, tx) : null;

    return { appliedRole, appliedProfile };
  });

  if (appliedRole) {
    await reconcileAfterTeamRoleChange(orgId, appliedRole, actorId);
  }

  if (appliedProfile) {
    await sendProfileUpdatedEmail(appliedProfile, { kind: 'org_admin', orgId, actorId });
  }

  return toPublicTeamMember(await getTeamMember(orgId, params.memberId));
}
