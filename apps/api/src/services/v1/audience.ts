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
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listAudienceService(orgId: string, query: TPublicApiAudienceQuery) {
  return getOrgAudience(orgId, query);
}

export async function createAudienceService(orgId: string, actorId: string | null, payload: TPublicApiCreateAudience) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  return importAudienceMembers(
    orgId,
    {
      recipientCsv: payload.email,
      courseIds: payload.courseIds,
      allCourses: false,
      allPrograms: false,
      sendEmail: payload.sendEmail
    },
    actorId
  );
}

export async function getAudienceMemberService(orgId: string, params: TPublicApiAudienceMemberParam) {
  return getOrgAudienceMember(orgId, params.memberId);
}

export async function assignAudienceCoursesService(orgId: string, payload: TPublicApiAssignAudienceCourses) {
  return assignAudienceToCourses(orgId, payload);
}

export async function removeAudienceService(orgId: string, memberId: number, actorId?: string | null) {
  return removeAudienceMember(orgId, memberId, actorId ?? undefined);
}

export async function updateAudienceService(
  orgId: string,
  memberId: number,
  actorId: string | null,
  payload: TPublicApiUpdateAudience
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await updatePendingAudienceMemberEmail(orgId, memberId, payload, actorId);

  return getOrgAudienceMember(orgId, memberId);
}
