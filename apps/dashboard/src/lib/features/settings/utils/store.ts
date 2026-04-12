import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

import type { OrgLandingPageJson } from '$lib/utils/types/org';
import { createDefaultLandingPageSettings } from '$features/org/utils/landing-page';

export const landingPageSettings: Writable<OrgLandingPageJson> = writable(createDefaultLandingPageSettings());
