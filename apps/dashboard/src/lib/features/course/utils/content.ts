import type { Course, CourseContentItem, CourseContentSection } from './types';
import { ExerciseIcon, LessonIcon } from '@cio/ui/custom/moving-icons';

import { ContentType as CourseContentType } from '@cio/utils/constants/content';
import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';

export type ContentItem = CourseContentItem;
export type ContentSection = CourseContentSection;

export type MentionableContent = {
  id: string;
  title: string;
  type: CourseContentType;
};

export const CONTENT_DEFINITIONS = {
  [CourseContentType.Section]: {
    label: 'Section',
    icon: TableOfContentsIcon
  },
  [CourseContentType.Lesson]: {
    label: 'Lesson',
    icon: LessonIcon
  },
  [CourseContentType.Exercise]: {
    label: 'Exercise',
    icon: ExerciseIcon
  }
} as const;

const EMPTY_CONTENT = {
  grouped: false,
  sections: [] as ContentSection[],
  items: [] as ContentItem[]
};

export function getContentRoute(courseId: string, item: { id: string; type: string }) {
  if (item.type === CourseContentType.Lesson) {
    return `/courses/${courseId}/lessons/${item.id}`;
  }

  if (item.type === CourseContentType.Exercise) {
    return `/courses/${courseId}/exercises/${item.id}`;
  }

  if (item.type === CourseContentType.Section) {
    return `/courses/${courseId}/lessons#section-${item.id}`;
  }

  return '';
}

export function getCourseContent(course: Course | null) {
  return course?.content ?? EMPTY_CONTENT;
}

const NAVIGABLE_CONTENT_TYPES = [CourseContentType.Lesson, CourseContentType.Exercise] as const;

export function getOrderedNavigableContent(course: Course | null): ContentItem[] {
  const content = getCourseContent(course);
  const items = content.grouped ? content.sections.flatMap((s) => s.items) : content.items;
  return items.filter((item) =>
    NAVIGABLE_CONTENT_TYPES.includes(item.type as (typeof NAVIGABLE_CONTENT_TYPES)[number])
  );
}

/**
 * Flat list of mentionable content for the AI chat @ menu.
 * Includes sections (when grouped) interleaved with their lessons/exercises in display order.
 */
export function getMentionableContent(course: Course | null): MentionableContent[] {
  const content = getCourseContent(course);

  if (!content.grouped) {
    return content.items
      .filter((item) => NAVIGABLE_CONTENT_TYPES.includes(item.type as (typeof NAVIGABLE_CONTENT_TYPES)[number]))
      .map((item) => ({ id: item.id, title: item.title, type: item.type as CourseContentType }));
  }

  const result: MentionableContent[] = [];

  for (const section of content.sections) {
    if (section.id !== 'ungrouped' && section.title) {
      result.push({ id: section.id, title: section.title, type: CourseContentType.Section });
    }

    for (const item of section.items) {
      if (NAVIGABLE_CONTENT_TYPES.includes(item.type as (typeof NAVIGABLE_CONTENT_TYPES)[number])) {
        result.push({ id: item.id, title: item.title, type: item.type as CourseContentType });
      }
    }
  }

  return result;
}
