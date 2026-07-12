import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export function genQuizPin(): number {
  const minm = 100000;
  const maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}

export function generateSitename(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
}

function navigateToUpgradeModal(removeParams: string[]) {
  const url = new URL(window.location.href);

  for (const param of removeParams) {
    url.searchParams.delete(param);
  }

  url.searchParams.set('upgrade', 'true');

  goto(resolve(url.pathname + `?${url.searchParams.toString()}`, {}));
}

/** Opens the in-app upgrade modal by setting `?upgrade=true`. Safe to use directly as an event handler. */
export function openUpgradeModal() {
  navigateToUpgradeModal([]);
}

/**
 * Opens the upgrade modal while dropping query params that keep another modal
 * open (e.g. `['add']` for the invite modal), so the upgrade modal isn't
 * stacked behind it — done in a single navigation to avoid a read-after-goto race.
 */
export function openUpgradeModalOver(removeParams: string[]) {
  navigateToUpgradeModal(removeParams);
}
