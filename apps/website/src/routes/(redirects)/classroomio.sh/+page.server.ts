import { trackAndRedirect } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = ({ request, platform }) =>
  trackAndRedirect(
    { request, platform },
    'classroomio.sh downloaded',
    'https://raw.githubusercontent.com/classroomio/classroomio/main/classroomio.sh'
  );
