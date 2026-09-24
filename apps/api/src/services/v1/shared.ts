import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { ensureProgramCourseAccess } from '@cio/core/services/course/course';
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

/**
 * Mirrors `courseMemberMiddleware` for the key's creator: the actor must be a course member (including program
 * access) or an org admin. Throws 401 without an actor and 403 otherwise.
 */
export async function assertCourseMemberOrOrgAdmin(courseId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const isAllowed = await isUserCourseMemberOrOrgAdmin(courseId, actorId);
  if (isAllowed) {
    return;
  }

  const hasProgramAccess = await ensureProgramCourseAccess(courseId, actorId);
  if (hasProgramAccess) {
    return;
  }

  throw new AppError('Automation actor must be a course member or an organization admin', ErrorCodes.FORBIDDEN, 403);
}

/**
 * Mirrors `courseTeamMemberMiddleware` for the key's creator: the actor must be a course tutor/admin or an org admin.
 * Throws 401 without an actor and 403 otherwise.
 */
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
