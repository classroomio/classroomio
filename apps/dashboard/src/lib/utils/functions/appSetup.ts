import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { initPosthog, type PosthogBootstrapUser } from '$lib/utils/services/posthog';
import { initUmami } from '$lib/utils/services/umami';
import { licenseApi } from '$features/license/api/license.svelte';

let isInitialized = false;

export function setupAnalytics(user?: PosthogBootstrapUser) {
  if (isInitialized) return;
  isInitialized = true;

  initPosthog(user);
  initUmami();
}

/** Checks if this is cloud deployment and initializes analytics */
export function setupCloudAnalytics(user?: PosthogBootstrapUser) {
  if (PUBLIC_IS_SELFHOSTED !== 'true') {
    setupAnalytics(user);
  }
}

export function setupAnalyticsBasedOnLicense(user?: PosthogBootstrapUser) {
  if (licenseApi.hasAccess('no-tracking')) {
    return;
  }

  setupAnalytics(user);
}
