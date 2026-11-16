import { getCourseCommentCourseContext, type TCourseCommentCourseContext } from '@cio/db/queries/course-comment';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { AppError, ErrorCodes } from '@cio/utils/errors';

/**
 * The course's org context. Throws 404 when the course is gone and 403 COURSE_COMMENTS_DISABLED
 * when its org switched team comments off. The caller's role is checked by the route middleware.
 */
export async function assertTeamCommentsEnabled(courseId: string): Promise<TCourseCommentCourseContext> {
  const context = await getCourseCommentCourseContext(courseId);
  if (!context) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  if (!context.teamCommentsEnabled) {
    throw new AppError('Team comments are turned off for this organization', ErrorCodes.COURSE_COMMENTS_DISABLED, 403);
  }

  return context;
}

/**
 * Whether a person may see a course's comments right now. Used outside requests (live delivery,
 * email digests), where no middleware has run.
 */
export async function canUseCourseComments(courseId: string, profileId: string): Promise<boolean> {
  const context = await getCourseCommentCourseContext(courseId);
  if (!context?.teamCommentsEnabled) return false;

  return isCourseTeamMemberOrOrgAdmin(courseId, profileId);
}
