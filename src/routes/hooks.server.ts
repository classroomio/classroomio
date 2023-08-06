import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
  if (event.url.host === 'classroomio.com') {
    throw redirect(307, 'https://about.classroomio.com');
  }

  const response = await resolve(event);
  return response;
}) satisfies Handle;
