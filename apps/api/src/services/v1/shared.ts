import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { AppError, ErrorCodes } from '@api/utils/errors';

export function assertAutomationActor(actorId: string | null): asserts actorId is string {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }
}

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

export async function assertCourseTeamMemberOrOrgAdmin(courseId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const isAllowed = await isCourseTeamMemberOrOrgAdmin(courseId, actorId);
  if (!isAllowed) {
    throw new AppError(
      'Automation actor must be a course tutor/admin or an organization admin',
      ErrorCodes.FORBIDDEN,
      403
    );
  }
}
