import { dev } from '$app/environment';
import posthog from 'posthog-js';

export const capturePosthogEvent = (event: string, properties?: Record<string, unknown>): void => {
  if (dev) return;

  posthog.capture(event, properties);
};

export const identifyPosthogUser = (id: string, properties?: Record<string, unknown>): void => {
  if (dev) return;

  posthog.identify(id, properties);
};

export const initPosthog = (): void => {
  if (dev) return;

  posthog.init('phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov', {
    api_host: 'https://eu.posthog.com'
  });
};

export const initOrgAnalytics = (siteId: string) => {
  if (dev) return;

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
