import { dev } from '$app/environment';
import { licenseApi } from '$features/license/api/license.svelte';
import posthog from 'posthog-js';

const hasNoTracking = () => licenseApi.hasAccess('no-tracking');

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
