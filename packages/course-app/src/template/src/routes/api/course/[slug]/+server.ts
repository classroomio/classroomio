import { json, error } from '@sveltejs/kit';
import { getCourse } from '$lib/utils/helpers/course';

export const GET = async ({ params }) => {
  try {
    const { slug } = params;
    const course = await getCourse(slug);

    return json(course);
  } catch (e) {
    console.error(e);

    error(404, `${e}`);
  }
};
