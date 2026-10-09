import { ContentType, ROLE } from '@cio/utils/constants';
import { assertStudentCanAccessContent } from '@cio/core/services/course/progression';
import { ensureProgramCourseAccess } from '@cio/core/services/course/course';
import { getCourseById, getCourseProgress } from '@cio/db/queries/course/course';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { AppError, ErrorCodes } from '@api/utils/errors';

const DEFAULT_CONTENT_GROUPING = true;

/**
 * Whether a profile can open a course: group member, org admin, or enrolled
 * through a learning path. Throws when a program backfill is blocked.
 */
export async function canProfileOpenCourse(courseId: string, profileId: string): Promise<boolean> {
  if (await isUserCourseMemberOrOrgAdmin(courseId, profileId)) {
    return true;
  }

  return Boolean(await ensureProgramCourseAccess(courseId, profileId));
}

/**
 * Blocks a STUDENT-role member from reading an unpublished course at all
 * (individual content, listings, everything). Non-student roles (tutor/admin
 * authoring the course) and courses that don't resolve are left untouched.
 */
export async function assertEnrolledStudentCourseAccess(params: {
  courseId: string;
  profileId: string;
}): Promise<void> {
  const [courseRow, progress] = await Promise.all([
    getCourseById(params.courseId),
    getCourseProgress(params.courseId, params.profileId)
  ]);

  const course = courseRow[0];
  if (!course) return;

  if (progress.roleId === ROLE.STUDENT && !course.isPublished) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
}

export async function assertEnrolledStudentContentAccess(params: {
  courseId: string;
  profileId: string;
  contentId: string;
  type: ContentType.Lesson | ContentType.Exercise;
}): Promise<void> {
  const [courseRow, progress, contentItems] = await Promise.all([
    getCourseById(params.courseId),
    getCourseProgress(params.courseId, params.profileId),
    getCourseContentItems(params.courseId, params.profileId)
  ]);

  const course = courseRow[0];
  if (!course) return;

  if (progress.roleId === ROLE.STUDENT && !course.isPublished) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const isContentGroupingEnabled = course.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;
  const progressionMode = course.metadata?.progressionMode ?? 'free';

  await assertStudentCanAccessContent({
    courseId: params.courseId,
    profileId: params.profileId,
    roleId: progress.roleId,
    contentId: params.contentId,
    type: params.type,
    progressionMode,
    contentRows: contentItems,
    isContentGroupingEnabled
  });
}
