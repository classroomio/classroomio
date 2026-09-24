import type {
  TPublicApiCourseParam,
  TPublicApiListCourseCertificatesQuery,
  TPublicApiUpdateCourseCertificate
} from '@cio/utils/validation/public-api';

import { ROLE } from '@cio/utils/constants';
import { getCourse, updateCourse } from '@cio/core/services/course/course';
import { getCourseById } from '@cio/db/queries/course/course';
import { listPaginatedCourseMembers } from '@api/services/course/people';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertCourseBelongsToOrganization,
  assertCourseMemberOrOrgAdmin,
  assertCourseTeamMemberOrOrgAdmin
} from '@api/services/v1/shared';

export async function getPublicApiCourseCertificateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseMemberOrOrgAdmin(params.courseId, actorId);

  const course = await getCourse(params.courseId, undefined, actorId ?? undefined);

  return course.certificate ?? {};
}

/**
 * Merges the payload into the stored certificate settings (omitted fields are kept, `design` is replaced whole)
 * and saves through the dashboard's `updateCourse`. Returns the saved certificate settings.
 */
export async function updatePublicApiCourseCertificateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourseCertificate
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  const [existingCourse] = await getCourseById(params.courseId);
  if (!existingCourse) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const theme = payload.theme ?? payload.design?.templateId;
  const certificate = {
    ...existingCourse.certificate,
    ...payload,
    ...(theme !== undefined && { theme })
  };

  const { course } = await updateCourse(params.courseId, { certificate });

  return course.certificate ?? {};
}

export async function listPublicApiCourseCertificatesService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiListCourseCertificatesQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  const result = await listPaginatedCourseMembers(params.courseId, {
    ...query,
    roleId: ROLE.STUDENT,
    certificateEarned: true
  });

  const items = result.items.map((member) => ({
    memberId: member.id,
    profileId: member.profileId,
    fullname: member.profile?.fullname ?? null,
    email: member.profile?.email ?? member.email ?? null,
    certificateEarnedAt: member.certificateEarnedAt,
    certificationEmailSentAt: member.certificationEmailSentAt
  }));

  const pagination = {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages
  };

  return { items, pagination };
}
