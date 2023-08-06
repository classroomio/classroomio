import { redirect } from '@sveltejs/kit';

export const load = ({ url }) => {
  console.log('url', url.hostname);

  if (url.hostname === 'classroomio.com') {
    throw redirect(301, 'https://about.classroomio.com');
  }
};
