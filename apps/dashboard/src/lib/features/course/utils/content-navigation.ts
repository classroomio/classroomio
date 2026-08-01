import type { Course } from './types';
import { getCourseContent, getOrderedNavigableContent, type ContentItem } from './content';

export function isNavigableContentUnlocked(item: ContentItem): boolean {
  return (item.isUnlocked ?? true) === true;
}

export function getFirstIncompleteNavigableContent(course: Course | null): ContentItem | undefined {
  return getOrderedNavigableContent(course).find((item) => !item.isComplete && isNavigableContentUnlocked(item));
}

export function findActiveNavigableContentIndex(items: ContentItem[], currentPath: string): number {
  return items.findIndex((item) => currentPath.includes(item.id));
}

export function resolveActiveNavigableContentIndex(course: Course | null, currentPath: string): number {
  const items = getOrderedNavigableContent(course);
  if (items.length === 0) {
    return -1;
  }

  const pathIndex = findActiveNavigableContentIndex(items, currentPath);
  if (pathIndex >= 0) {
    return pathIndex;
  }

  const firstIncomplete = getFirstIncompleteNavigableContent(course);
  if (firstIncomplete) {
    return items.findIndex((item) => item.id === firstIncomplete.id);
  }

  return 0;
}

export function getPreviousNavigableContent(course: Course | null, currentPath: string): ContentItem | null {
  const items = getOrderedNavigableContent(course);
  const activeIndex = resolveActiveNavigableContentIndex(course, currentPath);
  if (activeIndex <= 0) {
    return null;
  }

  return items[activeIndex - 1] ?? null;
}

export function getNextIncompleteNavigableContent(course: Course | null, currentPath: string): ContentItem | null {
  const items = getOrderedNavigableContent(course);
  const activeIndex = resolveActiveNavigableContentIndex(course, currentPath);
  if (activeIndex < 0) {
    return null;
  }

  for (let index = activeIndex + 1; index < items.length; index += 1) {
    const item = items[index];
    if (!item.isComplete && isNavigableContentUnlocked(item)) {
      return item;
    }
  }

  return null;
}

export function getActiveNavigableContent(course: Course | null, currentPath: string): ContentItem | null {
  const items = getOrderedNavigableContent(course);
  const activeIndex = resolveActiveNavigableContentIndex(course, currentPath);
  if (activeIndex < 0) {
    return null;
  }

  return items[activeIndex] ?? null;
}

export function getSectionIdForContentItem(course: Course | null, itemId: string | undefined): string | null {
  if (!itemId) {
    return null;
  }

  const content = getCourseContent(course);
  if (!content.grouped) {
    return null;
  }

  for (const section of content.sections) {
    if (section.items.some((item) => item.id === itemId)) {
      return section.id;
    }
  }

  return null;
}

export function getActiveSectionId(course: Course | null, currentPath: string): string | null {
  const activeItem = getActiveNavigableContent(course, currentPath);
  if (!activeItem) {
    return null;
  }

  return getSectionIdForContentItem(course, activeItem.id);
}

export function formatSectionCompletionLabel(completed: number, total: number): string {
  return `${completed}/${total}`;
}
