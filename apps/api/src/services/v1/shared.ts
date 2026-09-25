import { getCourseOrganizationId } from '@cio/db/queries/tag';
import {
  getOrganizationMemberIdByOrgAndProfile,
  getOrganizationMembersByNormalizedEmails
} from '@cio/db/queries/organization';
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

/**
 * Email twin of assertProfileBelongsToOrganization. Returns the member's profileId, or null for a pending member.
 */
export async function assertEmailBelongsToOrganization(orgId: string, email: string): Promise<string | null> {
  const members = await getOrganizationMembersByNormalizedEmails(orgId, [email]);
  if (members.length === 0) {
    throw new AppError(
      'No organization member with this email. Use the course invites endpoints to onboard someone new',
      ErrorCodes.PROFILE_NOT_FOUND,
      404
    );
  }

  return members.find((member) => member.profileId)?.profileId ?? null;
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
