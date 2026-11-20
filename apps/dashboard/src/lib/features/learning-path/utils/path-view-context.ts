import { getContext, setContext } from 'svelte';
import type { PathViewMode } from './types';

const PATH_VIEW_CONTEXT_KEY = Symbol('path-view-context');

/**
 * Shares the resolved `/paths/[publicId]` view mode with nested routes.
 * The layout sets a getter so children always read the current mode.
 */
export function setPathViewContext(getMode: () => PathViewMode) {
  setContext(PATH_VIEW_CONTEXT_KEY, { getMode });
}

/**
 * Reads the resolved `/paths/[publicId]` view mode set by the parent layout.
 * Must be called under the parent layout so the context exists.
 */
export function getPathViewContext(): { getMode: () => PathViewMode } {
  return getContext(PATH_VIEW_CONTEXT_KEY);
}
