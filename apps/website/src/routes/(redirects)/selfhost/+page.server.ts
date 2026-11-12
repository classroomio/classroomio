import { trackAndRedirect } from '$lib/utils/posthog/track-redirect';

export const prerender = false;

export const load = ({ request, platform }) =>
  trackAndRedirect({ request, platform }, 'selfhost visited', 'https://classroomio.com/docs/self-hosted');
