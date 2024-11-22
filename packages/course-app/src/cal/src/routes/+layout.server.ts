import { getPage } from '$lib/utils/helpers/page';
import { PAGE } from '$lib/utils/constants/page';
import { getCourses } from '$lib/utils/helpers/course';

export const load = async () => {
  const page = getPage(PAGE.HOME)!;
  const sharedPage = getPage(PAGE.SHARED)!;

  const courses = await getCourses();

  return {
    page,
    sharedPage,
    courses
  };
};
