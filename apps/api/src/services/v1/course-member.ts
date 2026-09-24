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
  addMembers,
  deleteMember,
  listPaginatedCourseMembers,
  resetMemberCourseProgress,
  updateMember
} from '@api/services/course/people';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getUserCourseAnalytics } from '@cio/core/services/course/course';
import {
  assertAutomationActor,
  assertCourseBelongsToOrganization,
  assertCourseTeamMemberOrOrgAdmin,
  assertProfileBelongsToOrganization
} from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

async function assertCanManageCourseMembers(orgId: string, courseId: string, actorId: string | null) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);
}

export async function listCourseMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseMembersQuery
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  return listPaginatedCourseMembers(params.courseId, query);
}

export async function addCourseMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiAddCourseMember
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  if (payload.profileId) {
    await assertProfileBelongsToOrganization(orgId, payload.profileId);
  }

  const [addedMember] = await addMembers(params.courseId, [payload]);

  return addedMember;
}

export async function getCourseMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  const member = await getCourseMember(params.courseId, params.memberId);
  if (!member) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  return member;
}

export async function updateCourseMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam,
  payload: TPublicApiUpdateCourseMember
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  return updateMember(params.courseId, params.memberId, payload);
}

export async function deleteCourseMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  return deleteMember(params.courseId, params.memberId);
}

export async function resetCourseMemberProgressService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam
) {
  assertAutomationActor(actorId);
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  return resetMemberCourseProgress(params.courseId, params.memberId, actorId);
}

export async function getCourseMemberAnalyticsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam,
  query: TPublicApiCourseMemberAnalyticsQuery
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  const member = await getCourseMember(params.courseId, params.memberId);
  if (!member || !member.profileId) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (member.roleId !== ROLE.STUDENT) {
    throw new AppError('Only student members have analytics', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return getUserCourseAnalytics(params.courseId, member.profileId, query);
}
