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

export function isCourseContentLockedForStudent(
  course: Course | null,
  contentId: string | undefined,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise | null
): boolean {
  if (!contentId || !contentType) {
    return false;
  }

  const item = findContentItem(course, contentId, contentType);

  if (!item) {
    return false;
  }

  return (item.isUnlocked ?? true) === false;
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
