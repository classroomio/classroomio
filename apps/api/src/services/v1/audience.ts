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
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getBulkAudienceMemberIdsByEmails } from '@cio/db/queries/organization';
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
    ? payload.memberIds.map((memberId) => ({ ids: [memberId], email: null }))
    : await resolveByEmails(orgId, payload.emails!);
  const memberIds = [...new Set(entries.flatMap((entry) => entry.ids))];
  const reasonById = await applyStatusChange(orgId, actorId, payload, memberIds);

  const rows = entries.map((entry, index) => {
    const outcomes = entry.ids.map((id) => reasonById.get(id) ?? 'CHANGED');
    const changedId = entry.ids.find((id) => !reasonById.has(id));
    const foundId = entry.ids.find((id) => reasonById.get(id) !== 'NOT_FOUND');
    const status = outcomes.includes('CHANGED')
      ? ('changed' as const)
      : outcomes.includes('ALREADY_IN_STATE')
        ? ('already_in_state' as const)
        : ('not_found' as const);

    return { index, memberId: changedId ?? foundId ?? null, email: entry.email, status };
  });
  const changedCount = rows.filter((row) => row.status === 'changed').length;

  return { action: payload.action, requested: rows.length, changed: changedCount, rows };
}

/** Each member id's failure reason from the apply itself; an id with no reason changed. */
async function applyStatusChange(
  orgId: string,
  actorId: string,
  payload: TPublicApiAudienceBulkStatus,
  memberIds: number[]
): Promise<Map<number, string>> {
  const allNotFound = new Map(memberIds.map((memberId) => [memberId, 'NOT_FOUND']));
  if (memberIds.length === 0) return allNotFound;

  const target = { mode: 'ids' as const, memberIds };

  try {
    const result = await applyBulkAudienceAction(
      orgId,
      { target, action: payload.action, reason: payload.reason },
      actorId
    );
    if (result.mode !== 'completed') {
      throw new Error('Bulk status change was queued unexpectedly');
    }

    return new Map(result.failed.map((failure) => [failure.memberId, failure.reason]));
  } catch (error) {
    const noneFound =
      error instanceof AppError && error.statusCode === 404 && error.code === ErrorCodes.ORG_AUDIENCE_BULK_FAILED;
    if (noneFound) return allNotFound;

    throw error;
  }
}

async function resolveByEmails(orgId: string, emails: string[]) {
  const matches = await getBulkAudienceMemberIdsByEmails(orgId, emails);

  return emails.map((email) => {
    const lowered = email.toLowerCase();
    const ids = matches.filter((match) => match.emails.includes(lowered)).map((match) => match.id);

    return { ids, email };
  });
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
