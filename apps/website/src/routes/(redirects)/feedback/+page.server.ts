import { trackAndRedirect } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = ({ request, platform }) =>
  trackAndRedirect({ request, platform }, 'feedback page visited', 'https://feedback.classroomio.com');
