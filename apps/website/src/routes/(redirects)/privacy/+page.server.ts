import { trackEvent } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = async ({ request, platform }) => {
  await trackEvent({ request, platform }, 'privacy policy page visited');

  return {
    pageMetaTags: {
      title: 'Privacy Policy | ClassroomIO',
      description:
        'How ClassroomIO collects, uses, stores, and protects personal data when you use our websites and services.'
    }
  };
};
