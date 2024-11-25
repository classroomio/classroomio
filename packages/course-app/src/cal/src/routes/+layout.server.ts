import { getPage } from '$lib/utils/helpers/page';
import { PAGE } from '$lib/utils/constants/page';
import type { Course } from '@/utils/types/course';

export const load = async ({ fetch }) => {
  const page = getPage(PAGE.HOME)!;
  const sharedPage = getPage(PAGE.SHARED)!;

  const response = await fetch('/api/courses');
  const courses: Course[] = await response.json();

  return {
    page,
    sharedPage,
    courses
  };
};
