import type {
  TPublicApiCreateTeamInviteLink,
  TPublicApiInviteTeamMembers,
  TPublicApiTeamInviteLinkQuery,
  TPublicApiTeamMemberParam,
  TPublicApiTeamQuery,
  TPublicApiUpdateTeamInviteLink,
  TPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';

import { db } from '@cio/db/drizzle';
import { updateProfile } from '@cio/db/queries/auth';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { getOrgTeam, removeTeamMember } from '@api/services/organization';
import {
  fetchOrgLinkInvite,
  getOrCreateLinkInvite,
  inviteTeamMembers,
  toggleOrgLinkInvite
} from '@api/services/organization/invite';
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

type TLinkInvite = { id: string; token: string; roleId: number; isRevoked: boolean };

function toPublicInviteLink(invite: TLinkInvite) {
  return {
    id: invite.id,
    roleId: invite.roleId,
    enabled: !invite.isRevoked,
    url: `${getAppBaseUrl()}/invite/link/${encodeURIComponent(invite.token)}`
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

export async function inviteTeamMembersService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiInviteTeamMembers
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return inviteTeamMembers(orgId, payload.emails, payload.roleId, actorId, payload.confirmedStudentEmails);
}

export async function removeTeamMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiTeamMemberParam
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  const removed = await removeTeamMember(orgId, params.memberId, actorId);

  return { id: removed.id, email: removed.email, roleId: removed.roleId };
}

export async function getTeamInviteLinkService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiTeamInviteLinkQuery
) {
  await assertOrgAdmin(orgId, actorId);

  const invite = await fetchOrgLinkInvite(orgId, query.roleId);

  return invite ? toPublicInviteLink(invite) : null;
}

export async function createTeamInviteLinkService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateTeamInviteLink
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return toPublicInviteLink(await getOrCreateLinkInvite(orgId, payload.roleId, actorId));
}

export async function updateTeamInviteLinkService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiUpdateTeamInviteLink
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return toPublicInviteLink(await toggleOrgLinkInvite(orgId, payload.roleId, !payload.enabled, actorId));
}
