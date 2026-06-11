import { ContentType } from '@cio/utils/constants/content';
import type { Course, CourseContentItem } from './types';

type ProgressionLockReason = 'teacher_locked' | 'progression_blocked';

function sortNavigableItems(items: CourseContentItem[]): CourseContentItem[] {
  return [...items].sort((left, right) => {
    const orderDiff = (left.order ?? 0) - (right.order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    const typeDiff = (left.type === ContentType.Lesson ? 0 : 1) - (right.type === ContentType.Lesson ? 0 : 1);
    if (typeDiff !== 0) return typeDiff;

    return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
  });
}

function getNavigableItems(course: Course): CourseContentItem[] {
  if (!course.content) return [];

  const items = course.content.grouped
    ? course.content.sections.flatMap((section) => section.items)
    : course.content.items;

  return sortNavigableItems(
    items.filter((item) => item.type === ContentType.Lesson || item.type === ContentType.Exercise)
  );
}

function lessonBlocksProgression(policy: string | null | undefined): boolean {
  return policy !== 'none';
}

function isItemProgressComplete(item: CourseContentItem): boolean {
  return Boolean(item.isComplete);
}

function computeProgressionAccess(
  navigableItems: CourseContentItem[],
  progressionMode: 'free' | 'sequential'
): Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }> {
  const accessById = new Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }>();
  let priorBlockingComplete = true;

  for (const item of navigableItems) {
    const teacherLocked = !(item.isUnlocked ?? false);
    const progressionLocked = progressionMode === 'sequential' && !priorBlockingComplete;

    let accessible = !teacherLocked && !progressionLocked;
    let lockReason: ProgressionLockReason | null = null;

    if (teacherLocked) {
      accessible = false;
      lockReason = 'teacher_locked';
    } else if (progressionLocked) {
      accessible = false;
      lockReason = 'progression_blocked';
    }

    accessById.set(item.id, { accessible, lockReason });

    const complete = isItemProgressComplete(item);
    const blocks = item.type === ContentType.Lesson ? lessonBlocksProgression(item.completionPolicy ?? 'manual') : true;

    if (blocks && !complete) {
      priorBlockingComplete = false;
    }
  }

  return accessById;
}

function annotateContentItem(
  item: CourseContentItem,
  accessById: Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }>
): CourseContentItem {
  const access = accessById.get(item.id);
  if (!access) return item;

  return {
    ...item,
    accessible: access.accessible,
    lockReason: access.lockReason
  };
}

/** Recomputes student progression locks on in-memory course content after completion changes. */
export function syncProgressionAccessToCourse(course: Course): Course {
  if (!course.content) return course;

  const progressionMode = course.metadata?.progressionMode === 'sequential' ? 'sequential' : 'free';
  const accessById = computeProgressionAccess(getNavigableItems(course), progressionMode);

  if (course.content.grouped) {
    return {
      ...course,
      content: {
        ...course.content,
        sections: course.content.sections.map((section) => ({
          ...section,
          items: section.items.map((item) => annotateContentItem(item, accessById))
        }))
      }
    };
  }

  return {
    ...course,
    content: {
      ...course.content,
      items: course.content.items.map((item) => annotateContentItem(item, accessById))
    }
  };
}
