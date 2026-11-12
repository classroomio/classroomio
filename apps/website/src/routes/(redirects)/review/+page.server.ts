import { trackAndRedirect } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = ({ request, platform }) =>
  trackAndRedirect({ request, platform }, 'review page visited', 'https://senja.io/p/classroomio/r/D6pWfS');
