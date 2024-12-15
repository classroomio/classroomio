import { redirect } from '@sveltejs/kit';

export const load = () => {
  redirect(307, 'https://www.npmjs.com/package/@classroomio/course-app');
};
