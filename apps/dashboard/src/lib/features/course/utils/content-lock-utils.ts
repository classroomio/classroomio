import { ContentType } from '@cio/utils/constants/content';
import type { StudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
import type { Course } from './types';
import { getCourseContent } from './content';

export type LockedContentItem = { id: string; type: ContentType.Lesson | ContentType.Exercise };

export function collectLockedContentItems(course: Course | null): LockedContentItem[] {
  const content = getCourseContent(course);

  const items = content.grouped ? content.sections.flatMap((section) => section.items) : content.items;

  return items
    .filter((item) => (item.isUnlocked ?? true) === false)
    .map((item) => ({
      id: item.id,
      type: item.type === ContentType.Exercise ? ContentType.Exercise : ContentType.Lesson
    }));
}

export function getStudentContentLockTitleKey(reason: StudentContentLockReason): string {
  if (reason === 'progression_locked') {
    return 'course.navItem.lessons.content_progression_locked_title';
  }

  return 'course.navItem.lessons.content_locked_title';
}

export function getStudentContentLockDescriptionKey(
  reason: StudentContentLockReason,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise
): string {
  if (reason === 'progression_locked') {
    if (contentType === ContentType.Exercise) {
      return 'course.navItem.lessons.content_progression_locked_description_exercise';
    }

    return 'course.navItem.lessons.content_progression_locked_description_lesson';
  }

  return 'course.navItem.lessons.content_locked_description';
}
