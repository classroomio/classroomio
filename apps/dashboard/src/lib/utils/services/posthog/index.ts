import { get } from 'svelte/store';
import { dev } from '$app/environment';
import posthog from 'posthog-js';
import { LICENSE_FEATURE } from '@cio/utils/license';
import { licenseFeatures } from '$lib/utils/store/license';

function hasNoTracking(): boolean {
  try {
    return get(licenseFeatures).includes(LICENSE_FEATURE.NO_TRACKING);
  } catch {
    return false;
  }
}

export const capturePosthogEvent = (event: string, properties?: Record<string, unknown>): void => {
  if (dev || hasNoTracking()) return;

  posthog.capture(event, properties);
};

export const identifyPosthogUser = (id: string, properties?: Record<string, unknown>): void => {
  if (dev || hasNoTracking()) return;

  posthog.identify(id, properties);
};

export const initPosthog = (): void => {
  if (dev || hasNoTracking()) return;

  posthog.init('phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov', {
    api_host: 'https://eu.posthog.com'
  });
};

export const initOrgAnalytics = (siteId: string) => {
  if (dev || hasNoTracking()) return;

  // add js to head of page
  const script1 = document.createElement('script');
  script1.textContent = `
    (function () {
        window.counterscale = {
            q: [["set", "siteId", "${siteId}"], ["trackPageview"]],
        };
    })();
  `;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.id = 'counterscale-script';
  script2.src = 'https://be13a4b3.counterscale-5jn.pages.dev/tracker.js';
  script2.defer = true;
  document.head.appendChild(script2);
};
