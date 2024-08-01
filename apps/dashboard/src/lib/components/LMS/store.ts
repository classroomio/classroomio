import { writable, derived } from 'svelte/store';
import type { Course } from '$lib/utils/types';

export const lms_courses = writable<any[]>([]);

export const coursesInProgress = derived(lms_courses, ($courses) =>
  $courses.length > 0
    ? $courses.filter((course) => {
        return course.total_lessons !== course.progress_rate;
      })
    : []
);
export const coursesComplete = derived(lms_courses, ($courses) =>
  $courses.length > 0
    ? $courses.filter((course) => {
        return course.total_lessons === course.progress_rate;
      })
    : []
);

export const lmsCourseMetaDeta = writable<{
  isLoading: boolean;
  view: 'grid' | 'list';
}>({
  isLoading: true,
  view: 'grid'
});
