import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseProgress } from '@cio/core/services/course/course';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';

/**
 * Returns a member's course progress to the requester. Members may read their
 * own progress; reading anyone else's requires a course team member or org admin.
 */
export async function getCourseProgressForRequester(params: {
  courseId: string;
  requesterId: string;
  profileId: string;
}) {
  const { courseId, requesterId, profileId } = params;

  if (profileId !== requesterId) {
    const canViewOthers = await isCourseTeamMemberOrOrgAdmin(courseId, requesterId);
    if (!canViewOthers) {
      throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 403);
    }
  }

  return getCourseProgress(courseId, profileId);
}
