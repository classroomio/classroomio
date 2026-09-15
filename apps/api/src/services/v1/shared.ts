import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function assertCourseBelongsToOrganization(orgId: string, courseId: string): Promise<void> {
  const courseOrganizationId = await getCourseOrganizationId(courseId);
  if (!courseOrganizationId || courseOrganizationId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
}

export async function assertProfileBelongsToOrganization(orgId: string, profileId: string): Promise<void> {
  const memberId = await getOrganizationMemberIdByOrgAndProfile(orgId, profileId);
  if (!memberId) {
    throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
  }
}
