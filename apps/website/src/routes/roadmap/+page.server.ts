import { redirect } from '@sveltejs/kit';

export const prerender = false;

export const load = () => {
  redirect(307, 'https://feedback.classroomio.com/roadmap');
};
