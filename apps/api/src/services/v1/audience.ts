import type {
  TPublicApiAssignAudienceCourses,
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
import { getOrgAudience, getOrgAudienceMember, removeAudienceMember } from '@api/services/organization';
import type { TEventSource } from '@cio/core/services/posthog';
import { updateUser } from '@api/services/account/profile';
import { assertAutomationActor, assertMemberHasJoined, assertOrgAdmin } from './shared';

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

  if (payload.name !== undefined) {
    assertMemberHasJoined(member.profileId);
  }

  if (payload.email !== undefined) {
    await updatePendingAudienceMemberEmail(
      orgId,
      memberId,
      { email: payload.email, sendEmail: payload.sendEmail },
      actorId
    );
  }

  if (payload.name !== undefined && member.profileId) {
    await updateUser(member.profileId, { fullname: payload.name });
  }

  return getOrgAudienceMember(orgId, memberId);
}
