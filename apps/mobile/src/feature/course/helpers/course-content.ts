import { flattenNavigableItems } from '@cio/utils/functions/course-progression';

import type {
  ContentItemState,
  CourseContent,
  CourseContentItem,
  OutlineSection
} from '@/feature/course/types/course-detail';

const UNGROUPED_SECTION_ID = 'ungrouped';

export function outlineSections(content: CourseContent): OutlineSection[] {
  if (!content.grouped) return [{ id: 'items', title: null, items: content.items }];

  return content.sections
    .filter((section) => section.items.length > 0)
    .map((section) => ({
      id: section.id,
      title: section.id === UNGROUPED_SECTION_ID ? null : section.title,
      items: section.items
    }));
}

/** Lessons and exercises in the order the API uses for progression. */
export function navigableItems(content: CourseContent): CourseContentItem[] {
  return flattenNavigableItems(content);
}

export function isAccessible(item: CourseContentItem) {
  return item.accessible !== false;
}

/** The first open item the learner has not finished, which is where they resume. */
export function currentItem(items: CourseContentItem[]) {
  return items.find((item) => isAccessible(item) && !item.isComplete) ?? null;
}

export function itemState(item: CourseContentItem, currentId: string | null): ContentItemState {
  if (!isAccessible(item)) return 'locked';
  if (item.isComplete) return 'complete';
  if (item.id === currentId) return 'current';

  return 'available';
}

export function neighborsOf(items: CourseContentItem[], id: string) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return { previous: null, next: null, index: -1 };

  return { previous: items[index - 1] ?? null, next: items[index + 1] ?? null, index };
}

export function completionCount(items: CourseContentItem[]) {
  return { completed: items.filter((item) => item.isComplete).length, total: items.length };
}

export function findItem(items: CourseContentItem[], id: string) {
  return items.find((item) => item.id === id) ?? null;
}
