import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { assertCourseMemberOrOrgAdmin } from '@api/services/v1/shared';
import { getPluginCourseEnrollmentById, getPluginCourseEnrollmentsList } from '@cio/db/queries';
import { type TPluginApiCourseEnrollment, ZPluginApiCourseEnrollment } from '@cio/utils/validation/plugin';

export async function listCourseEnrollmentsForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ items: TPluginApiCourseEnrollment[]; nextCursor: string | null }> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'course.enrollment:read'
  });

  await assertCourseMemberOrOrgAdmin(courseId, actorId);

  const canReadAll = authorization.organizationRole === 'admin' || authorization.organizationRole === 'tutor';
  const result = await getPluginCourseEnrollmentsList(organizationId, courseId, actorId, canReadAll, options);

  const items = result.items.map((item) => ZPluginApiCourseEnrollment.parse(item));

  return { items, nextCursor: result.nextCursor };
}

export async function getCourseEnrollmentForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string,
  enrollmentId: string
): Promise<TPluginApiCourseEnrollment> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'course.enrollment:read'
  });

  await assertCourseMemberOrOrgAdmin(courseId, actorId);

  const canReadAll = authorization.organizationRole === 'admin' || authorization.organizationRole === 'tutor';
  const item = await getPluginCourseEnrollmentById(organizationId, courseId, enrollmentId, actorId, canReadAll);

  if (!item) {
    throw new AppError('Enrollment not found', 'ENROLLMENT_NOT_FOUND', 404);
  }

  return ZPluginApiCourseEnrollment.parse(item);
}
