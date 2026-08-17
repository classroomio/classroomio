import {
  annotateContentItem,
  computeProgressionAccess,
  flattenNavigableItems
} from '@cio/utils/functions/course-progression';
import type { Course } from './types';

/** Recomputes student progression locks on in-memory course content after completion changes. */
export function syncProgressionAccessToCourse(course: Course): Course {
  if (!course.content) return course;

  const progressionMode = course.metadata?.progressionMode === 'sequential' ? 'sequential' : 'free';
  const navigableItems = flattenNavigableItems(course.content);
  const accessById = computeProgressionAccess({
    navigableItems,
    progressionMode
  });

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
