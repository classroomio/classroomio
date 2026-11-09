import { getContext, setContext } from 'svelte';
import type { BlockEditHost, BlockViewHost } from './types';

const VIEW_HOST_KEY = Symbol('block-view-host');
const EDIT_HOST_KEY = Symbol('block-edit-host');

/**
 * Makes the surface's view host available to block views below. Pass a getter so a host prop stays reactive.
 */
export function setBlockViewHost(getHost: () => BlockViewHost): void {
  setContext(VIEW_HOST_KEY, getHost);
}

export function getBlockViewHost(): BlockViewHost {
  return getContext<() => BlockViewHost>(VIEW_HOST_KEY)();
}

/**
 * Makes the surface's edit host available to block editors and pickers below.
 */
export function setBlockEditHost(getHost: () => BlockEditHost): void {
  setContext(EDIT_HOST_KEY, getHost);
}

export function getBlockEditHost(): BlockEditHost {
  return getContext<() => BlockEditHost>(EDIT_HOST_KEY)();
}
