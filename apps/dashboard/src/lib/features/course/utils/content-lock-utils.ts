import { ContentType } from '@cio/utils/constants/content';
import { assertNever } from '@cio/utils/functions/assert-never';
import type { StudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
import type { Course } from './types';
import { getCourseContent } from './content';

export type LockedContentItem = { id: string; type: ContentType.Lesson | ContentType.Exercise };

export function collectLockedContentItems(course: Course | null): LockedContentItem[] {
  const content = getCourseContent(course);

  const items = content.grouped ? content.sections.flatMap((section) => section.items) : content.items;

  return items.flatMap((item): LockedContentItem[] => {
    if ((item.isUnlocked ?? true) !== false) return [];

    switch (item.type) {
      case ContentType.Lesson:
        return [{ id: item.id, type: ContentType.Lesson }];
      case ContentType.Exercise:
        return [{ id: item.id, type: ContentType.Exercise }];
      case ContentType.Section:
        return [];
      default:
        return assertNever(item.type);
    }
  });
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
    switch (contentType) {
      case ContentType.Exercise:
        return 'course.navItem.lessons.content_progression_locked_description_exercise';
      case ContentType.Lesson:
        return 'course.navItem.lessons.content_progression_locked_description_lesson';
      default:
        return assertNever(contentType);
    }
  }

  return 'course.navItem.lessons.content_locked_description';
}
