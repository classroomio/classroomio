import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { initPosthog } from '$lib/utils/services/posthog';
import { initSentry } from '$lib/utils/services/sentry';
import { initUmami } from '$lib/utils/services/umami';
import { licenseApi } from '$features/license/api/license.svelte';

let isInitialized = false;

export function setupAnalytics() {
  if (isInitialized) return;
  isInitialized = true;

  initSentry();
  initPosthog();
  initUmami();
}

/** Checks if this is cloud deployment and initializes analytics */
export function setupCloudAnalytics() {
  if (PUBLIC_IS_SELFHOSTED !== 'true') {
    setupAnalytics();
  }
}

export function setupAnalyticsBasedOnLicense() {
  if (licenseApi.hasAccess('no-tracking')) {
    return;
  }

  setupAnalytics();
}
