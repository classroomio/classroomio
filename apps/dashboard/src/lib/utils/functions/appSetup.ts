import { dev } from '$app/environment';
import { LICENSE_FEATURE } from '@cio/utils/license';
import { initPosthog } from '$lib/utils/services/posthog';
import { initSentry } from '$lib/utils/services/sentry';

/**
 * @param licenseFeatures - From layout load. When 'no-tracking' is licensed, PostHog and other tracking are disabled.
 */
export function setupAnalytics(licenseFeatures: string[] = []) {
  // Set up sentry
  initSentry();

  // PostHog: skip when no-tracking is licensed (enterprise privacy) or in dev
  const noTracking = licenseFeatures.includes(LICENSE_FEATURE.NO_TRACKING);
  if (!noTracking) {
    initPosthog();
  }

  // Disable umami on localhost
  if (dev) {
    localStorage.setItem('umami.disabled', '1');
  }
}
