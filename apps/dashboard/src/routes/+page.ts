import type { Component } from 'svelte';
import { normalizeLandingPageSettings, importThemeComponent } from '$features/org/utils/landing-page';

// Universal load (runs on server AND client) so the theme component is resolved
// before the first render. This eliminates the blank flash between hydration and
// the onMount-based dynamic import the page previously used.
export const load = async ({ parent, data }) => {
  const layoutData = await parent();

  if (!layoutData.isOrgSite || !layoutData.org) {
    return { ...data, ThemeComponent: null as Component | null };
  }

  const settings = normalizeLandingPageSettings(layoutData.org.landingpage);
  const mod = await importThemeComponent(settings.theme);

  return { ...data, ThemeComponent: mod.default as Component };
};
