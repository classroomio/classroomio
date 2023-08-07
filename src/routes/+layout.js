import { redirect } from '@sveltejs/kit';

export const load = ({ url }) => {
  if (url.hostname === 'classroomio.com') {
    throw redirect(301, 'https://about.classroomio.com');
  }
};
