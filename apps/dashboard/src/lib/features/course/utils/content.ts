import type { Course, CourseContentItem, CourseContentSection } from './types';
import { ExerciseIcon, LessonIcon } from '@cio/ui/custom/moving-icons';

import { ContentType as CourseContentType } from '@cio/utils/constants/content';
import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';

export type ContentItem = CourseContentItem;
export type ContentSection = CourseContentSection;

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

export function getContentRoute(courseId: string, item: ContentItem) {
  if (item.type === CourseContentType.Lesson) {
    return `/courses/${courseId}/lessons/${item.id}`;
  }

  if (item.type === CourseContentType.Exercise) {
    return `/courses/${courseId}/exercises/${item.id}`;
  }

  return '';
}

export function getCourseContent(course: Course | null) {
  return course?.content ?? EMPTY_CONTENT;
}
