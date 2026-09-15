import type {
  TPublicApiAddCourseMember,
  TPublicApiCourseMemberAnalyticsQuery,
  TPublicApiCourseMemberParam,
  TPublicApiCourseMembersQuery,
  TPublicApiUpdateCourseMember
} from '@cio/utils/validation/public-api';
import type { TPublicApiCourseParam } from '@cio/utils/validation/public-api';

import { ROLE } from '@cio/utils/constants';
import {
  addMember,
  deleteMember,
  listPaginatedCourseMembers,
  resetMemberCourseProgress,
  updateMember
} from '@api/services/course/people';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getProfileById } from '@cio/db/queries/auth';
import { getUserCourseAnalytics } from '@cio/core/services/course/course';
import { assertCourseBelongsToOrganization } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listCourseMembersService(
  orgId: string,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseMembersQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return listPaginatedCourseMembers(params.courseId, query);
}

export async function addCourseMemberService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiAddCourseMember
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  if (payload.profileId) {
    const profile = await getProfileById(payload.profileId);
    if (!profile) {
      throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }
  }

  return addMember(params.courseId, payload);
}

export async function getCourseMemberService(orgId: string, params: TPublicApiCourseMemberParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const member = await getCourseMember(params.courseId, params.memberId);
  if (!member) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  return member;
}

export async function updateCourseMemberService(
  orgId: string,
  params: TPublicApiCourseMemberParam,
  payload: TPublicApiUpdateCourseMember
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return updateMember(params.courseId, params.memberId, payload);
}

export async function deleteCourseMemberService(orgId: string, params: TPublicApiCourseMemberParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return deleteMember(params.courseId, params.memberId);
}

export async function resetCourseMemberProgressService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return resetMemberCourseProgress(params.courseId, params.memberId, actorId);
}

export async function getCourseMemberAnalyticsService(
  orgId: string,
  params: TPublicApiCourseMemberParam,
  query: TPublicApiCourseMemberAnalyticsQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const member = await getCourseMember(params.courseId, params.memberId);
  if (!member || !member.profileId) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (member.roleId !== ROLE.STUDENT) {
    throw new AppError('Only student members have analytics', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return getUserCourseAnalytics(params.courseId, member.profileId, query);
}
