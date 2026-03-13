import { redirect } from '@sveltejs/kit';

export const prerender = false;

export const load = ({ request }) => {
  redirect(307, 'https://heyform.net/f/1qkguGkN');
};
