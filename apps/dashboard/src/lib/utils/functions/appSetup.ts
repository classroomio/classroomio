import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { initPosthog, type PosthogBootstrapUser } from '$lib/utils/services/posthog';
import { initUmami } from '$lib/utils/services/umami';
import { initUserJot } from '$lib/utils/services/userjot';
import { licenseApi } from '$features/license/api/license.svelte';

let isTrackingInitialized = false;

function setupTracking(user?: PosthogBootstrapUser) {
  if (isTrackingInitialized) return;
  isTrackingInitialized = true;

  initPosthog(user);
  initUmami();
}

export function setupAnalytics(user?: PosthogBootstrapUser) {
  initUserJot();
  setupTracking(user);
}

/** Checks if this is cloud deployment and initializes analytics */
export function setupCloudAnalytics(user?: PosthogBootstrapUser) {
  if (PUBLIC_IS_SELFHOSTED !== 'true') {
    setupAnalytics(user);
  }
}

export function setupAnalyticsBasedOnLicense(user?: PosthogBootstrapUser) {
  initUserJot();

  if (licenseApi.hasAccess('no-tracking')) {
    return;
  }

  setupTracking(user);
}
