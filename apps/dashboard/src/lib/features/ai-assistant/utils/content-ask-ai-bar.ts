import type { Course, CourseContentItem } from '$features/course/utils/types';
import { getCourseContent } from '$features/course/utils/content';
import { ContentType } from '@cio/utils/constants/content';

function findContentItem(
  course: Course | null,
  contentId: string,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise
): CourseContentItem | undefined {
  const content = getCourseContent(course);
  const items = content.grouped ? content.sections.flatMap((section) => section.items) : content.items;

  return items.find((item) => item.id === contentId && item.type === contentType);
}

export type StudentContentLockReason = 'teacher_locked' | 'progression_locked';

export function getStudentContentLockReason(
  course: Course | null,
  contentId: string | undefined,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise | null
): StudentContentLockReason | null {
  if (!contentId || !contentType) {
    return null;
  }

  const item = findContentItem(course, contentId, contentType);

  if (!item) {
    return null;
  }

  if ((item.isUnlocked ?? true) === false) {
    return 'teacher_locked';
  }

  if (item.accessible === false) {
    return 'progression_locked';
  }

  return null;
}

export function isCourseContentLockedForStudent(
  course: Course | null,
  contentId: string | undefined,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise | null
): boolean {
  return getStudentContentLockReason(course, contentId, contentType) !== null;
}

export function getContentAskAiBarWidthClass(options: {
  lessonId: string | undefined;
  isLessonEditMode: boolean;
}): string {
  if (options.lessonId) {
    return options.isLessonEditMode ? 'mx-auto w-full lg:w-full xl:w-11/12' : 'mx-auto w-full max-w-3xl';
  }

  return 'mx-auto w-full md:max-w-3xl';
}
