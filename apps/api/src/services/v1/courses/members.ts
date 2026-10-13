import type {
  TPublicApiAddCourseMember,
  TPublicApiCourseMemberAnalyticsQuery,
  TPublicApiCourseMemberParam,
  TPublicApiCourseMembersQuery,
  TPublicApiUpdateCourseMember
} from '@cio/utils/validation/public-api';
import type { TPublicApiCourseParam } from '@cio/utils/validation/public-api';
import type { TUpdateCourseMember } from '@cio/utils/validation/course/people';

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
  assertEmailBelongsToOrganization,
  assertProfileBelongsToOrganization
} from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { PUBLIC_API_ANALYTICS_TTL_SECONDS, publicApiAnalyticsKey } from '@api/utils/redis/key-generators';
import { cachedRead } from '@api/utils/redis/cached-read';

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

  let member = payload;
  if (payload.profileId) {
    await assertProfileBelongsToOrganization(orgId, payload.profileId);
  } else if (payload.email) {
    const profileId = await assertEmailBelongsToOrganization(orgId, payload.email);
    if (profileId) {
      member = { ...payload, profileId };
    }
  }

  const [addedMember] = await addMembers(params.courseId, [member]);

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

  return updateMember(params.courseId, params.memberId, payload satisfies TUpdateCourseMember);
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

/**
 * Analytics for one course membership, cached per course, profile and `includeProgressImpact`.
 * Throws 404 when the member is missing and 400 when they are not a student; neither is cached.
 */
export async function loadCourseMemberAnalytics(
  courseId: string,
  memberId: string,
  query: TPublicApiCourseMemberAnalyticsQuery
) {
  const member = await getCourseMember(courseId, memberId);
  if (!member || !member.profileId) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (member.roleId !== ROLE.STUDENT) {
    throw new AppError('Only student members have analytics', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const profileId = member.profileId;
  const impactVariant = query.includeProgressImpact ? 'with-impact' : 'base';
  const { data } = await cachedRead(
    publicApiAnalyticsKey('course-student', courseId, profileId, impactVariant),
    PUBLIC_API_ANALYTICS_TTL_SECONDS,
    () => getUserCourseAnalytics(courseId, profileId, query)
  );

  return data;
}

export async function getCourseMemberAnalyticsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseMemberParam,
  query: TPublicApiCourseMemberAnalyticsQuery
) {
  await assertCanManageCourseMembers(orgId, params.courseId, actorId);

  return loadCourseMemberAnalytics(params.courseId, params.memberId, query);
}
