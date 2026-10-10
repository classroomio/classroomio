import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';

export const prerender = false;

export const load = ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'review page visited'
  });

  redirect(307, 'https://senja.io/p/classroomio/r/D6pWfS');
};
