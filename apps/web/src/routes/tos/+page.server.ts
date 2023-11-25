import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';

export const load = async ({ request }) => {
  client.capture({
    distinctId:
      request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'privacy page visited',
  });

  throw redirect(
    301,
    'https://app.enzuzo.com/policies/tos/958fc978-5477-11ee-a03b-7b111830c594'
  );
};
