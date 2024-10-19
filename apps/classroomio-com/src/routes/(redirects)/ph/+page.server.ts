import { redirect } from '@sveltejs/kit';

export const load = async () => {
  throw redirect(307, 'https://www.producthunt.com/posts/classroomio-2');
};
