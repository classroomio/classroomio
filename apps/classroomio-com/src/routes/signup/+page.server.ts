import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';

export const load = ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'signup'
  });

  throw redirect(301, 'https://app.classroomio.com/signup');
};
