import { NAV_ITEMS, NAV_ITEM_KEY } from './constants';

import type { Course } from '$features/course/utils/types';
import type { Review } from '$features/course/utils/types';
import get from 'lodash/get';

export function getExerciseCount(lessons) {
  return lessons.reduce((total, lesson) => total + (lesson.totalExercises?.[0]?.count || 0), 0);
}

export function getLessonSections(data) {
  const sections =
    data?.lesson_section?.map((section) => {
      return {
        ...section,
        lessons: data.lessons.filter((lesson) => lesson.section_id === section.id)
      };
    }) || [];

  return sections || [];
}

export function getTotalLessons(sections) {
  return sections.reduce((total, section) => {
    return total + section.lessons.length;
  }, 0);
}

export function filterNavItems(course: Course, reviews: Review[]) {
  const rules = get(course, 'metadata.sectionDisplay', {});

  return NAV_ITEMS.filter((item) => {
    const key = item.key;

    if (typeof rules[key] === 'boolean') {
      return !!rules[key];
    }

    if (key === NAV_ITEM_KEY.REVIEWS) {
      // Show only if there are reviews added
      return reviews.length > 0;
    }

    // In case they are undefined
    return true;
  });
}
