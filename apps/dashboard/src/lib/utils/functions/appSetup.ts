import { dev } from '$app/environment';
import { initPosthog } from '$lib/utils/services/posthog';
import { initSentry } from '$lib/utils/services/sentry';
import { licenseApi } from '$features/license/api/license.svelte';

export function setupAnalytics() {
  // Set up sentry
  initSentry();

  // PostHog: skip when no-tracking is licensed (enterprise privacy) or in dev
  const noTracking = licenseApi.hasAccess('no-tracking');
  if (!noTracking) {
    initPosthog();
  }

  // Disable umami on localhost
  if (dev) {
    localStorage.setItem('umami.disabled', '1');
  }
}
