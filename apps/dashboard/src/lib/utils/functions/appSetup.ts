import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { dev } from '$app/environment';
import { initPosthog } from '$lib/utils/services/posthog';
import { initSentry } from '$lib/utils/services/sentry';
import { licenseApi } from '$features/license/api/license.svelte';

/** Cloud: always true. Self-hosted: true only when no-tracking is not licensed. */
export function shouldInitPosthog(): boolean {
  const isCloud = PUBLIC_IS_SELFHOSTED !== 'true';
  const noTracking = licenseApi.hasAccess('no-tracking');
  return isCloud || !noTracking;
}

export function setupAnalytics() {
  initSentry();

  if (shouldInitPosthog()) {
    initPosthog();
  }

  if (dev) {
    localStorage.setItem('umami.disabled', '1');
  }
}

/** Cloud: call from layout on mount. Self-hosted: call from setupApp onSuccess after license. */
export function setupAnalyticsForDeployment(mode: 'cloud' | 'self-hosted') {
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  if (mode === 'cloud' && !isSelfHosted) {
    setupAnalytics();
    return;
  }

  if (mode === 'self-hosted' && isSelfHosted) {
    setupAnalytics();
  }
}
