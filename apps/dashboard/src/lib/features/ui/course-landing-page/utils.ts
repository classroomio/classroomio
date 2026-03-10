import type { Course, CourseContentItem } from '$features/course/utils/types';
import { NAV_ITEMS, NAV_ITEM_KEY } from './constants';

import { ContentType } from '@cio/utils/constants/content';
import type { Review } from '$features/course/utils/types';
import get from 'lodash/get';

export type LandingPageLesson = {
  id: string;
  title: string | null;
  order?: number | null;
  createdAt?: string | null;
};

export type LandingPageSection = {
  id: string;
  title: string | null;
  lessons: LandingPageLesson[];
  exerciseCount: number;
};

function sortLessons(lessons: LandingPageLesson[]): LandingPageLesson[] {
  return [...lessons]
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function getLessonsFromItems(items: CourseContentItem[]): LandingPageLesson[] {
  const lessonItems = items.filter((item) => item.type === ContentType.Lesson);
  const lessons = lessonItems.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    order: lesson.order ?? null,
    createdAt: lesson.createdAt ?? null
  }));

  return lessons;
}

function getExerciseCountFromItems(items: CourseContentItem[]): number {
  return items.filter((item) => item.type === ContentType.Exercise).length;
}

export function getCourseLessons(course: Course): LandingPageLesson[] {
  if (!course?.content) return [];

  if (course.content.grouped) {
    const groupedLessons = course.content.sections.flatMap((section) => getLessonsFromItems(section.items));
    return sortLessons(groupedLessons);
  }

  if (!course.content.items.length) return [];
  return getLessonsFromItems(course.content.items);
}

export function getCourseSections(course: Course): LandingPageSection[] {
  if (!course?.content) return [];

  if (course.content.grouped) {
    return course.content.sections.map((section) => {
      const lessons = getLessonsFromItems(section.items);
      return {
        id: section.id,
        title: section.title ?? course.title ?? 'Lessons',
        lessons,
        exerciseCount: getExerciseCountFromItems(section.items)
      };
    });
  }

  if (!course.content.items.length) return [];

  return [
    {
      id: 'ungrouped',
      title: course.title ?? 'Lessons',
      lessons: getLessonsFromItems(course.content.items),
      exerciseCount: getExerciseCountFromItems(course.content.items)
    }
  ];
}

export function getTotalLessons(sections: LandingPageSection[]) {
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
