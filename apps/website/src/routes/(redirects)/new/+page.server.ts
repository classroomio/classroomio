import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
  const url = dev ? 'http://localhost:5173' : 'https://app.classroomio.com';

  redirect(307, `${url}/org/*/courses?create=true`);
};
