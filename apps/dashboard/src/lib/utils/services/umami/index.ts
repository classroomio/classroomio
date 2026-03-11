import { dev } from '$app/environment';
import { licenseApi } from '$features/license/api/license.svelte';

const UMAMI_WEBSITE_ID = '80a9544a-4dda-4c91-b62f-b6be7a8a3b5c';

export const initUmami = (): void => {
  if (dev || licenseApi.hasAccess('no-tracking')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://umami.hz.oncws.com/script.js';
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  const nonce = document.querySelector('script[nonce]')?.getAttribute('nonce');
  if (nonce) script.setAttribute('nonce', nonce);
  document.head.appendChild(script);
};
