import { goto, replaceState } from '$app/navigation';

import { page } from '$app/state';
import { resolve } from '$app/paths';
import { writable } from 'svelte/store';

/** Params used by entry points outside the app: billing emails and the post-checkout return URL. */
export const UPGRADE_PARAM = 'upgrade';
export const UPGRADE_CONFIRMATION_PARAM = 'confirmation';

/**
 * The modal lives in app state rather than in the URL. Opening it must never navigate:
 * pages that guard unsaved work (exercise editor, course settings, certificates) treat any
 * navigation as leaving and ask the user to discard their changes before the modal can show.
 */
export const isUpgradeModalOpen = writable(false);

type UpgradeCheckoutHandoff = () => void;

const checkoutHandoffs = new Set<UpgradeCheckoutHandoff>();

/**
 * Checkout is an external redirect that unloads the page, so an editor holding unsaved work
 * registers here to stash it before the browser leaves. Returns an unregister function.
 */
export function onUpgradeCheckoutHandoff(handoff: UpgradeCheckoutHandoff) {
  checkoutHandoffs.add(handoff);

  return () => {
    checkoutHandoffs.delete(handoff);
  };
}

export function runUpgradeCheckoutHandoffs() {
  for (const handoff of checkoutHandoffs) {
    handoff();
  }
}

/** Opens the in-app upgrade modal. Safe to use directly as an event handler. */
export function openUpgradeModal() {
  isUpgradeModalOpen.set(true);
}

/**
 * Opens the upgrade modal and closes another query-param driven modal (e.g. `['add']` for the
 * invite modal) so the two don't stack. The modal opens first so it shows either way.
 */
export function openUpgradeModalOver(paramsToRemove: string[]) {
  openUpgradeModal();

  const url = new URL(page.url);
  const presentParams = paramsToRemove.filter((param) => url.searchParams.has(param));

  if (presentParams.length === 0) return;

  for (const param of presentParams) {
    url.searchParams.delete(param);
  }

  goto(resolve(`${url.pathname}${url.search}`, {}), { replaceState: true, keepFocus: true, noScroll: true });
}

export function closeUpgradeModal() {
  isUpgradeModalOpen.set(false);
}

/**
 * Strips the upgrade params from the address bar with shallow routing, so a refresh doesn't
 * reopen the modal. This leaves `page.url` untouched — SvelteKit only updates it on a real
 * navigation — so callers must track for themselves that the params were already handled.
 */
export function clearUpgradeSearchParams() {
  const url = new URL(page.url);
  const hasUpgradeParams = url.searchParams.has(UPGRADE_PARAM) || url.searchParams.has(UPGRADE_CONFIRMATION_PARAM);

  if (!hasUpgradeParams) return;

  url.searchParams.delete(UPGRADE_PARAM);
  url.searchParams.delete(UPGRADE_CONFIRMATION_PARAM);

  replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
}
