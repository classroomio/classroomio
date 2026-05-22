import { dev } from '$app/environment';
import { get } from 'svelte/store';
import { globalStore } from '$lib/utils/store/app';
import { licenseApi } from '$features/license/api/license.svelte';

const USERJOT_APP_ID = 'cm4a6vcmp00jpmdb5n66rmkzz';

let isInitialized = false;

function isWidgetAllowed(): boolean {
  if (dev) return false;
  if (licenseApi.hasAccess('no-tracking')) return false;
  if (get(globalStore).isOrgSite) return false;

  return true;
}

function ensureSdkLoaded(): void {
  if (window.uj) return;

  window.$ujq = window.$ujq || [];
  window.uj =
    window.uj ||
    (new Proxy({} as Window['uj'], {
      get:
        (_, prop) =>
        (...args: unknown[]) =>
          window.$ujq.push([prop, ...args])
    }) as Window['uj']);

  const script = document.createElement('script');
  script.type = 'module';
  script.async = true;
  script.src = 'https://cdn.userjot.com/sdk/v2/uj.js';
  const nonce = document.querySelector('script[nonce]')?.getAttribute('nonce');
  if (nonce) script.setAttribute('nonce', nonce);
  document.head.appendChild(script);
}

export function initUserJot(): void {
  if (isInitialized) return;
  if (!isWidgetAllowed()) return;

  ensureSdkLoaded();

  window.uj.init(USERJOT_APP_ID, {
    widget: true,
    position: 'right',
    theme: 'auto'
  });

  isInitialized = true;
}

type UserJotIdentity = {
  id: string;
  email?: string;
  fullname?: string | null;
  avatarUrl?: string | null;
};

export function identifyUserJotUser({ id, email, fullname, avatarUrl }: UserJotIdentity): void {
  if (!isWidgetAllowed()) return;

  ensureSdkLoaded();

  const [firstName, ...rest] = (fullname ?? '').trim().split(/\s+/);
  const lastName = rest.join(' ');

  window.uj.identify({
    id,
    email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    avatar: avatarUrl ?? undefined
  });
}
