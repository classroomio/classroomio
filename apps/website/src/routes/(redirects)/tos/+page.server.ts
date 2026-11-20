import { trackEvent } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = async ({ request, platform }) => {
  await trackEvent({ request, platform }, 'terms of service page visited');

  return {
    pageMetaTags: {
      title: 'Terms of Service | ClassroomIO',
      description: 'Terms governing your access to and use of ClassroomIO websites, content, and services.'
    }
  };
};
