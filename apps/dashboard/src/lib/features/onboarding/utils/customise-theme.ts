import { ZOnboardingCustomise } from '@cio/utils/validation/onboarding';
import type { LandingPageThemeKey } from '$features/org/utils/landing-page';
import type { CustomiseHandoff } from './types';

const THEME_THUMBNAIL_BASE = 'https://assets.cdn.clsrio.com/templates';
const HANDOFF_STORAGE_KEY = 'onboarding-customise-handoff';

export function themeThumbnailUrl(theme: LandingPageThemeKey): string {
  return `${THEME_THUMBNAIL_BASE}/${theme}.png`;
}

/** Stashes the Customise draft in sessionStorage so it survives the checkout redirect. */
export function writeCustomiseHandoff(handoff: CustomiseHandoff) {
  try {
    const stored = { orgName: handoff.orgName, brandColour: handoff.brandColour, landingTheme: handoff.theme };
    sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    return;
  }
}

/** Reads the draft stashed before checkout. Returns null when there is none or it no longer validates. */
export function readCustomiseHandoff(): CustomiseHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;

    const parsed = ZOnboardingCustomise.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    return { orgName: parsed.data.orgName, brandColour: parsed.data.brandColour, theme: parsed.data.landingTheme };
  } catch {
    return null;
  }
}

export function clearCustomiseHandoff() {
  try {
    sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
  } catch {
    return;
  }
}
