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
import { updateUser } from '@api/services/account/profile';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor, assertOrgAdmin } from './shared';

export async function listAudienceService(orgId: string, actorId: string | null, query: TPublicApiAudienceQuery) {
  await assertOrgAdmin(orgId, actorId);

  return getOrgAudience(orgId, query);
}

export async function createAudienceService(orgId: string, actorId: string | null, payload: TPublicApiCreateAudience) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return importAudienceMembers(
    orgId,
    {
      recipientCsv: payload.email,
      courseIds: payload.courseIds,
      allCourses: false,
      allCohorts: false,
      sendEmail: payload.sendEmail
    },
    actorId
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
  payload: TPublicApiAssignAudienceCourses
) {
  await assertOrgAdmin(orgId, actorId);

  return assignAudienceToCourses(orgId, payload);
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

  // email needs a pending member and name a joined one, so check both before writing either.
  if (payload.name !== undefined && !member.profileId) {
    throw new AppError(
      'Only members who have joined can be renamed. A pending member has no profile yet',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'name'
    );
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
