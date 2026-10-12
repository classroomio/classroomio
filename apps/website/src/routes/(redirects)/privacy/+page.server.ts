import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';

export const prerender = false;

export const load = async ({ request }) => {
  client.capture({
    distinctId: getDistinctId(request),
    event: 'privacy policy page visited'
  });

  return {
    pageMetaTags: {
      title: 'Privacy Policy | ClassroomIO',
      description:
        'How ClassroomIO collects, uses, stores, and protects personal data when you use our websites and services.'
    }
  };
};
