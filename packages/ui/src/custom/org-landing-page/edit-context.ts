import { getContext, setContext } from 'svelte';
import type { Component } from 'svelte';

/**
 * Sections in the org landing page that the editor allows you to click in the preview
 * to open. Matches the keys used by the editor's section list.
 */
export type LandingSectionKey = 'hero' | 'navigation' | 'callout' | 'embed' | 'links' | 'footer';

export interface LandingPageEditContext {
  /** Reactive read of the currently selected section (or null if none). */
  selectedKey: () => LandingSectionKey | null;
  /** Sets the selected section. Pass `null` to deselect. */
  selectKey: (key: LandingSectionKey | null) => void;
  /** Human-readable label for the section cap (typically translated). */
  labelFor: (key: LandingSectionKey) => string;
  /** Icon component rendered inside the section cap. */
  iconFor: (key: LandingSectionKey) => Component;
}

const KEY = Symbol('orgLandingPageEdit');

export function setLandingPageEditContext(ctx: LandingPageEditContext): void {
  setContext(KEY, ctx);
}

export function getLandingPageEditContext(): LandingPageEditContext | null {
  return getContext<LandingPageEditContext | null>(KEY) ?? null;
}
