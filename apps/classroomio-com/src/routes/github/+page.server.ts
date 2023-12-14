import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';

export const load = async ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'github page visited'
  });

  throw redirect(307, 'https://github.com/rotimi-best/classroomio');
};
