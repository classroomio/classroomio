import { client } from '$lib/utils/posthog';

export const prerender = false;

export const load = async ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
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
