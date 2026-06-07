import { getContext, setContext } from 'svelte';
import type { Component } from 'svelte';

/**
 * Sections that an editor allows you to click in the preview to open the
 * corresponding form. Includes both the org landing page sections AND the
 * course landing page sections — the same `EditableLandingSection` wrapper
 * is used in both contexts.
 *
 * Org sections: hero, navigation, callout, embed, links, footer.
 * Course sections: header (course hero), requirement, description, goals,
 * certificate, curriculum, chips (skills/tools), instructor, reviews, pricing.
 */
export type LandingSectionKey =
  | 'hero'
  | 'navigation'
  | 'callout'
  | 'embed'
  | 'links'
  | 'footer'
  | 'header'
  | 'requirement'
  | 'description'
  | 'goals'
  | 'certificate'
  | 'curriculum'
  | 'chips'
  | 'instructor'
  | 'reviews'
  | 'pricing';

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
