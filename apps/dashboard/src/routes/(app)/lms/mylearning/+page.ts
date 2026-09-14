import { redirect } from '@sveltejs/kit';

export const load = () => {
  redirect(307, '/lms/mylearning/learning-paths');
};
