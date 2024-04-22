import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';

export const load = ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'cal.com page visited'
  });

  throw redirect(307, 'https://heyform.net/f/1qkguGkN');
};
