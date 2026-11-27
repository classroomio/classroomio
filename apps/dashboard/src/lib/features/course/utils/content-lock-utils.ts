import { ContentType } from '@cio/utils/constants/content';
import type { StudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
import type { Course, CourseContentItem } from './types';
import { getCourseContent, getOrderedNavigableContent } from './content';

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

/** Label for an outline lock icon: held back by the teacher, or otherwise waiting on progression. */
export function getContentLockIndicatorLabelKey(isTeacherHeld: boolean): string {
  return getStudentContentLockTitleKey(isTeacherHeld ? 'teacher_locked' : 'progression_locked');
}

export type StudentContentLockMessage = { key: string; values?: { title: string } };

/**
 * Returns the earliest required, incomplete item before the given item in course order: the one a learner must
 * finish before sequential progression opens it. Null when nothing earlier is blocking.
 */
export function findProgressionBlockingItem(
  course: Course | null,
  contentId: string,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise
): CourseContentItem | null {
  for (const item of getOrderedNavigableContent(course)) {
    if (item.id === contentId && item.type === contentType) return null;

    if (item.completionPolicy !== 'none' && !item.isComplete) return item;
  }

  return null;
}

/**
 * Title of the item a learner must finish to open the given one, or null when there is none to point them to,
 * including when that item is itself held back by the teacher and so cannot be finished yet.
 */
export function getProgressionBlockingItemTitle(
  course: Course | null,
  contentId: string,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise
): string | null {
  const blockingItem = findProgressionBlockingItem(course, contentId, contentType);
  if (!blockingItem || blockingItem.isUnlocked === false) return null;

  return blockingItem.title ?? null;
}

export function getStudentContentLockDescription(
  reason: StudentContentLockReason,
  contentType: typeof ContentType.Lesson | typeof ContentType.Exercise,
  blockingItemTitle?: string | null
): StudentContentLockMessage {
  if (reason === 'teacher_locked') {
    return { key: 'course.navItem.lessons.content_locked_description' };
  }

  const isExercise = contentType === ContentType.Exercise;

  if (blockingItemTitle) {
    const key = isExercise
      ? 'course.navItem.lessons.content_progression_locked_description_named_exercise'
      : 'course.navItem.lessons.content_progression_locked_description_named_lesson';

    return { key, values: { title: blockingItemTitle } };
  }

  const key = isExercise
    ? 'course.navItem.lessons.content_progression_locked_description_exercise'
    : 'course.navItem.lessons.content_progression_locked_description_lesson';

  return { key };
}
