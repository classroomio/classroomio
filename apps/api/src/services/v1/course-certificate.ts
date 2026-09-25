import type {
  TPublicApiCourseCertificateMemberParam,
  TPublicApiCourseParam,
  TPublicApiDownloadCourseCertificateQuery,
  TPublicApiListCourseCertificatesQuery,
  TPublicApiUpdateCourseCertificate
} from '@cio/utils/validation/public-api';
import type { TCourse } from '@cio/db/types';

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { updateCourse } from '@cio/core/services/course/course';
import { getCourseById, getCourseByIdForUpdate } from '@cio/db/queries/course/course';
import { getCourseMember, getPaginatedCourseMembers } from '@cio/db/queries/course/people';
import { assembleCertificateRender } from '@api/services/course/certificate';
import { generateCertificatePdf, generateCertificatePng, resolveCertificateDesign } from '@api/utils/certificate';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertCourseBelongsToOrganization,
  assertCourseMemberOrOrgAdmin,
  assertCourseTeamMemberOrOrgAdmin
} from '@api/services/v1/shared';

const DEFAULT_THRESHOLD = 100;
const DEFAULT_EXERCISE_MIN_SCORE_PERCENT = 100;

type TCertificateCourse = Pick<TCourse, 'certificate' | 'type' | 'compliance'>;

/**
 * Returns the settings the dashboard shows and completion evaluation applies: stored values with defaults filled in.
 */
export function toEffectiveCertificateSettings(course: TCertificateCourse) {
  const stored = course.certificate ?? {};
  const design = resolveCertificateDesign(stored);
  const requiredExerciseId = stored.requiredExerciseId ?? null;
  const complianceMinScore = course.type === 'COMPLIANCE' ? (course.compliance?.passingScore ?? null) : null;
  const requiredExerciseMinScore =
    stored.exerciseMinScorePercent ?? complianceMinScore ?? DEFAULT_EXERCISE_MIN_SCORE_PERCENT;

  return {
    isDownloadable: stored.isDownloadable ?? false,
    theme: stored.theme ?? design.templateId,
    design,
    deadline: stored.deadline ?? null,
    threshold: stored.threshold ?? DEFAULT_THRESHOLD,
    requiredExerciseId,
    exerciseMinScorePercent: requiredExerciseId ? requiredExerciseMinScore : (stored.exerciseMinScorePercent ?? null),
    emailMessage: stored.emailMessage ?? null
  };
}

async function getActiveCourse(courseId: string) {
  const [course] = await getCourseById(courseId);
  if (!course || course.status !== 'ACTIVE') {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return course;
}

export async function getPublicApiCourseCertificateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseMemberOrOrgAdmin(params.courseId, actorId);

  const course = await getActiveCourse(params.courseId);

  return toEffectiveCertificateSettings(course);
}

/**
 * Merges the payload into the stored settings under a row lock: omitted fields are kept, `null` clears a field, and
 * `design` is replaced whole. Returns the effective settings after the save.
 */
export async function updatePublicApiCourseCertificateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourseCertificate
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  return db.transaction(async (tx) => {
    const [existingCourse] = await getCourseByIdForUpdate(params.courseId, tx);
    if (!existingCourse || existingCourse.status !== 'ACTIVE') {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    const theme = payload.theme ?? payload.design?.templateId;
    const certificate = {
      ...existingCourse.certificate,
      ...payload,
      ...(theme !== undefined && { theme })
    };

    const { course } = await updateCourse(params.courseId, { certificate }, tx);

    return toEffectiveCertificateSettings(course);
  });
}

export async function listPublicApiCourseCertificatesService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiListCourseCertificatesQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  const result = await getPaginatedCourseMembers(params.courseId, {
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

/**
 * Renders the certificate a student of the course has earned, as the student would download it. Throws 404 when the
 * member is not a student of this course or has not earned the certificate.
 */
export async function downloadPublicApiCourseCertificateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseCertificateMemberParam,
  query: TPublicApiDownloadCourseCertificateQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);
  await getActiveCourse(params.courseId);

  const member = await getCourseMember(params.courseId, params.memberId);
  if (!member || member.roleId !== ROLE.STUDENT || !member.certificateEarnedAt) {
    throw new AppError('Certificate not found', ErrorCodes.NOT_FOUND, 404);
  }

  const issuedAt = new Date(member.certificateEarnedAt).toISOString();
  const renderInput = await assembleCertificateRender(params.courseId, {
    studentName: member.profile?.fullname || 'Recipient',
    studentId: member.profileId ?? undefined,
    issuedAt
  });

  const file =
    query.format === 'png' ? await generateCertificatePng(renderInput) : await generateCertificatePdf(renderInput);

  return { file, format: query.format, courseName: renderInput.data.courseName };
}
