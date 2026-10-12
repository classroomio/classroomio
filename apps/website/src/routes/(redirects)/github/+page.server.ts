import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';

export const prerender = false;

export const load = async ({ request }) => {
  client.capture({
    distinctId: getDistinctId(request),
    event: 'github page visited'
  });

  redirect(307, 'https://github.com/rotimi-best/classroomio');
};
