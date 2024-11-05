import { redirect } from '@sveltejs/kit';

export const load = async () => {
  redirect(307, 'https://t.me/thebestafricans');
};
