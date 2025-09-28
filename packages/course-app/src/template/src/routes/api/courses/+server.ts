import { json, error } from '@sveltejs/kit';
import { getCourses } from '$lib/utils/helpers/course';

export const GET = async () => {
  try {
    const courses = await getCourses();

    return json(courses);
  } catch (e) {
    console.error(e);

    error(500, `${e}`);
  }
};
