import { redirect } from '@sveltejs/kit';

export const load = async () => {
  redirect(307, 'https://docs.google.com/presentation/d/1eqvNPNk167ZcP21gZGVAatdDpWAFL9lfmWJHHrzsVFc');
};
