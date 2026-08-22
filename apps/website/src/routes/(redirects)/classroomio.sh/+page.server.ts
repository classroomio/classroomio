import { redirect } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';

export const prerender = false;

export const load = ({ request }) => {
  client.capture({
    distinctId: request.headers.get('x-forwarded-for') || new Date().getTime().toString(),
    event: 'classroomio.sh downloaded'
  });

  redirect(307, 'https://raw.githubusercontent.com/classroomio/classroomio/main/classroomio.sh');
};
