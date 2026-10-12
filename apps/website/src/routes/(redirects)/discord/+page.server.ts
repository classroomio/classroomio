import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';

export const prerender = false;

export const load = ({ request }) => {
  client.capture({
    distinctId: getDistinctId(request),
    event: 'discord page visited'
  });

  redirect(307, 'https://discord.gg/dRmxBpJw59');
};
