import type { Component } from 'svelte';
import { normalizeLandingPageSettings, importCourseLandingPageTheme } from '$features/org/utils/landing-page';

// `data` is the return value of the sibling +page.server.ts — layout data comes via parent().
export const load = async ({ data }) => {
  if (!data.course) {
    return { ...data, themeComponent: null as Component | null };
  }

  const org = data.org ?? null;
  const settings = normalizeLandingPageSettings(org?.landingpage);
  const mod = await importCourseLandingPageTheme(settings.theme);

  return { ...data, themeComponent: mod.default as Component };
};
