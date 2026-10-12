import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';

export const prerender = false;

export const load = async ({ request }) => {
  client.capture({
    distinctId: getDistinctId(request),
    event: 'terms of service page visited'
  });

  return {
    pageMetaTags: {
      title: 'Terms of Service | ClassroomIO',
      description: 'Terms governing your access to and use of ClassroomIO websites, content, and services.'
    }
  };
};
