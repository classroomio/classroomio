import type { Component } from 'svelte';
import { normalizeLandingPageSettings, importLearningPathLandingPageTheme } from '$features/org/utils/landing-page';

// `data` is the return value of the sibling +page.server.ts — layout data comes via parent().
export const load = async ({ data }) => {
  if (!data.detail) {
    return { ...data, themeComponent: null as Component | null };
  }

  const org = data.org ?? null;
  const settings = normalizeLandingPageSettings(org?.landingpage);
  const mod = await importLearningPathLandingPageTheme(settings.theme);

  return { ...data, themeComponent: mod.default as Component };
};
