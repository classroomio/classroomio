import type {
  TPublicApiAssignAudienceCourses,
  TPublicApiAudienceBulkStatus,
  TPublicApiAudienceMemberParam,
  TPublicApiAudienceQuery,
  TPublicApiCreateAudience,
  TPublicApiUpdateAudience
} from '@cio/utils/validation/public-api';

import {
  assignAudienceToCourses,
  importAudienceMembers,
  updatePendingAudienceMemberEmail
} from '@api/services/organization/audience';
import { getBulkAudienceMemberIdsByEmails, getBulkAudienceMembersByIds } from '@cio/db/queries/organization';
import { getOrgAudience, getOrgAudienceMember, removeAudienceMember } from '@api/services/organization';
import { applyBulkAudienceAction } from '@api/services/organization/audience-bulk';
import type { TEventSource } from '@cio/core/services/posthog';
import { updateUser } from '@api/services/account/profile';
import { assertAutomationActor, assertMemberHasJoined, assertOrgAdmin, toProfileUpdate } from './shared';

export async function listAudienceService(orgId: string, actorId: string | null, query: TPublicApiAudienceQuery) {
  await assertOrgAdmin(orgId, actorId);

  return getOrgAudience(orgId, query);
}

export async function createAudienceService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateAudience,
  source: TEventSource = 'public_api'
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  const recipients = payload.emails?.map((email) => ({ email }));

  return importAudienceMembers(
    orgId,
    {
      recipients,
      recipientCsv: payload.email,
      courseIds: payload.courseIds,
      allCourses: false,
      allCohorts: false,
      sendEmail: payload.sendEmail
    },
    actorId,
    source
  );
}

export async function getAudienceMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiAudienceMemberParam
) {
  await assertOrgAdmin(orgId, actorId);

  return getOrgAudienceMember(orgId, params.memberId);
}

export async function assignAudienceCoursesService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiAssignAudienceCourses,
  source: TEventSource = 'public_api'
) {
  await assertOrgAdmin(orgId, actorId);

  return assignAudienceToCourses(orgId, payload, source, actorId);
}

/** Mirrors `POST /organization/audience/bulk-action` (`orgAdminMiddleware`) for the four status actions, by id or email. */
export async function bulkUpdateAudienceStatusService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiAudienceBulkStatus
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  const entries = payload.memberIds
    ? await resolveByIds(orgId, payload.memberIds)
    : await resolveByEmails(orgId, payload.emails!);
  const memberIds = [...new Set(entries.flatMap((entry) => entry.ids))];

  const unchangedIds = new Set<number>();
  if (memberIds.length > 0) {
    const result = await applyBulkAudienceAction(
      orgId,
      { target: { mode: 'ids', memberIds }, action: payload.action, reason: payload.reason },
      actorId
    );

    if (result.mode !== 'completed') {
      throw new Error('Bulk status change was queued unexpectedly');
    }
    result.failed.forEach((failure) => unchangedIds.add(failure.memberId));
  }

  const rows = entries.map((entry, index) => ({
    index,
    memberId: entry.ids[0] ?? null,
    email: entry.email,
    status:
      entry.ids.length === 0
        ? ('not_found' as const)
        : entry.ids.every((id) => unchangedIds.has(id))
          ? ('already_in_state' as const)
          : ('changed' as const)
  }));

  return {
    action: payload.action,
    requested: rows.length,
    changed: rows.filter((row) => row.status === 'changed').length,
    rows
  };
}

type TBulkStatusEntry = { ids: number[]; email: string | null };

async function resolveByIds(orgId: string, memberIds: number[]): Promise<TBulkStatusEntry[]> {
  const found = new Set((await getBulkAudienceMembersByIds(orgId, memberIds)).map((member) => member.id));

  return memberIds.map((memberId) => ({ ids: found.has(memberId) ? [memberId] : [], email: null }));
}

async function resolveByEmails(orgId: string, emails: string[]): Promise<TBulkStatusEntry[]> {
  const idsByEmail = new Map<string, number[]>();
  for (const match of await getBulkAudienceMemberIdsByEmails(orgId, emails)) {
    idsByEmail.set(match.matchedEmail, [...(idsByEmail.get(match.matchedEmail) ?? []), match.id]);
  }

  return emails.map((email) => ({ ids: idsByEmail.get(email.toLowerCase()) ?? [], email }));
}

export async function removeAudienceService(orgId: string, memberId: number, actorId: string | null) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return removeAudienceMember(orgId, memberId, actorId);
}

export async function updateAudienceService(
  orgId: string,
  memberId: number,
  actorId: string | null,
  payload: TPublicApiUpdateAudience
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  const member = await getOrgAudienceMember(orgId, memberId);
  const profileUpdate = toProfileUpdate(payload);

  if (profileUpdate) {
    assertMemberHasJoined(member.profileId, payload);
  }

  if (payload.email !== undefined) {
    await updatePendingAudienceMemberEmail(
      orgId,
      memberId,
      { email: payload.email, sendEmail: payload.sendEmail },
      actorId
    );
  }

  if (profileUpdate && member.profileId) {
    await updateUser(member.profileId, profileUpdate, { kind: 'org_admin', orgId, actorId });
  }

  return getOrgAudienceMember(orgId, memberId);
}
