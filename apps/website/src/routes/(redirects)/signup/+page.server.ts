import { client } from '$lib/utils/posthog';
import { redirect } from '@sveltejs/kit';

export const load = ({ request, url }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'signup'
  });

  redirect(307, `https://app.classroomio.com/signup${url.search ?? ''}`);
};
