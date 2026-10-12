import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';
import { redirect } from '@sveltejs/kit';

export const prerender = false;

export const load = ({ request, url }) => {
  client.capture({
    distinctId: getDistinctId(request),
    event: 'signup'
  });

  redirect(307, `https://app.classroomio.com/signup${url.search ?? ''}`);
};
