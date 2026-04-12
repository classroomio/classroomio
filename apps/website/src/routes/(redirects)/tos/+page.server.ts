import { client } from '$lib/utils/posthog';

export const prerender = false;

export const load = async ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'terms of service page visited'
  });

  return {
    pageMetaTags: {
      title: 'Terms of Service | ClassroomIO',
      description: 'Terms governing your access to and use of ClassroomIO websites, content, and services.'
    }
  };
};
