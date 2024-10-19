import { redirect } from '@sveltejs/kit';

export const load = async () => {
  throw redirect(307, 'https://form.classroomio.com/f/1v25DtmN');
};
