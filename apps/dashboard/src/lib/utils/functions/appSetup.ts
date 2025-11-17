import { dev } from '$app/environment';
import { initPosthog } from '$lib/utils/services/posthog';
import { initSentry } from '$lib/utils/services/sentry';

export function setupAnalytics() {
  // Set up sentry
  initSentry();

  // Set up posthog
  initPosthog();

  // Disable umami on localhost
  if (dev) {
    localStorage.setItem('umami.disabled', '1');
  }
}
