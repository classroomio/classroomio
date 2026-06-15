import { ContentType } from '@cio/utils/constants';
import { assertStudentCanAccessContent } from '@cio/core/services/course/progression';
import { getCourseById, getCourseProgress } from '@cio/db/queries/course/course';
import { getCourseContentItems } from '@cio/db/queries/course/content';

const DEFAULT_CONTENT_GROUPING = true;

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
