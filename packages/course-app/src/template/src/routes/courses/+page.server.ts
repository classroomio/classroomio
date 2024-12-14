import { getPage } from '$lib/utils/helpers/page';
import { PAGE } from '$lib/utils/constants/page';
import type { Course } from '@/utils/types/course';
import { homePage, sharedPage as sharedPageStore } from '$lib/utils/stores/pages';
import { courses as coursesStore } from '$lib/utils/stores/course';

export const load = async ({ fetch }) => {
  const page = getPage(PAGE.COURSES)!;
  const sharedPage = getPage(PAGE.SHARED)!;

  const response = await fetch('/api/courses');
  const courses: Course[] = await response.json();

  homePage.set(page);
  sharedPageStore.set(sharedPage);
  coursesStore.set(courses);

  return {
    page,
    sharedPage,
    courses
  };
};
