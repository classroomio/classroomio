import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { AppError, ErrorCodes } from '@api/utils/errors';

/** Throws a 404 AppError unless the course belongs to the organization named in the request. */
export async function assertCourseInOrg(courseId: string, orgId: string): Promise<void> {
  const courseOrgId = await getOrgIdByCourseId(courseId);
  if (courseOrgId === orgId) return;

  throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
}
