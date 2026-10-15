import { AppError, ErrorCodes } from '@api/utils/errors';
import { getActiveOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { getCourseOrgAndStatus } from '@cio/db/queries/course';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getActivePathGrantsForCourseAndProfile, hasLiveNonPathGrant } from '@cio/db/queries/learning-path';

export type TCourseRedirectTarget = { type: 'course' } | { type: 'path'; publicId: string } | { type: 'hub' };

/**
 * Decides where a learner should open a course, for the learning-path
 * redirect behavior: independent (non-path) access stays on the course URL,
 * exactly one live path grant redirects into that path, otherwise the hub.
 *
 * The LMS calls this in learner view with authMiddleware only (never the
 * course-member middleware, which would 403 a learner on a locked path
 * course — exactly when the redirect into the path is needed).
 *
 * 404s when the course does not exist or is outside every org the caller
 * belongs to. Course team members and org admins always land on the course.
 */
export async function resolveCourseRedirect(courseId: string, profileId: string): Promise<TCourseRedirectTarget> {
  const course = await getCourseOrgAndStatus(courseId);

  if (!course || !course.organizationId || course.status !== 'ACTIVE') {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const orgId = course.organizationId;

  const orgMemberId = await getActiveOrganizationMemberIdByOrgAndProfile(orgId, profileId);

  if (!orgMemberId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (await isCourseTeamMemberOrOrgAdmin(courseId, profileId)) {
    return { type: 'course' };
  }

  const [hasNonPathAccess, pathGrants] = await Promise.all([
    hasLiveNonPathGrant(courseId, profileId),
    getActivePathGrantsForCourseAndProfile(courseId, profileId)
  ]);

  if (hasNonPathAccess) {
    return { type: 'course' };
  }

  const redirectable = pathGrants.filter((grant): grant is { learningPathId: string; publicId: string } =>
    Boolean(grant.publicId)
  );

  if (redirectable.length === 1) {
    return { type: 'path', publicId: redirectable[0].publicId };
  }

  return { type: 'hub' };
}
