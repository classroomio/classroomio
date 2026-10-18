import { trackAndRedirect } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = ({ request, url, platform }) =>
  trackAndRedirect({ request, platform }, 'signup', `https://app.classroomio.com/signup${url.search}`);
