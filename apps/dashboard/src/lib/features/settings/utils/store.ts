import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

import type { OrgLandingPageJson } from '$lib/utils/types/org';
import type { LandingSectionKey } from '@cio/ui/custom/org-landing-page';
import { createDefaultLandingPageSettings } from '$features/org/utils/landing-page';

export const landingPageSettings: Writable<OrgLandingPageJson> = writable(createDefaultLandingPageSettings());

/**
 * Section currently selected in the landing-page editor preview. Shared between
 * the left rail (which switches its panel based on this) and the preview wrappers
 * (which render the outline + cap when their sectionKey matches). `null` means
 * no section is selected — the editor shows the section list.
 */
export const landingPageEditorSelection: Writable<LandingSectionKey | null> = writable(null);

type SettingsHeaderAction = {
  label: string;
  disabled: boolean;
  loading: boolean;
  onClick: null | (() => void | Promise<void>);
};

export const settingsHeaderAction: Writable<SettingsHeaderAction> = writable({
  label: 'Save',
  disabled: true,
  loading: false,
  onClick: null
});
