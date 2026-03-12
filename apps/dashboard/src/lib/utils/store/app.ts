import { derived, writable } from 'svelte/store';

import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { currentOrgPath } from './org';

export const globalStore = writable<{
  isDark: boolean;
  isOrgSite: boolean;
  orgSiteName: string;
  isStudent?: boolean;
}>({
  isDark: false,
  isOrgSite: false,
  orgSiteName: '',
  isStudent: undefined
});

/**
 * Single source of truth: is this a student experience?
 * Cloud: orgSite is always student. Self-hosted: check role.
 *
 * why are we not using isOrgStudent from org store?
 * because this is derived from the currentOrg which returns null if no org OR boolean if org is present. Once org data is set, we then update globalStore.isStudent to the same value.
 *
 * why  are we not using only globalStore.isStudent for this?
 * because in the cloud instance, when a teacher logs into the lms aka org site, they need to be treated as a student so they see what the student sees.
 */
export const isStudentExperience = derived(globalStore, ($gs) => {
  const isCloud = PUBLIC_IS_SELFHOSTED !== 'true';
  if (isCloud) return $gs.isOrgSite;
  return $gs.isStudent ?? false;
});

/**
 * The root path for navigation: '/lms' for students, '/org/{siteName}' for admin/teacher
 */
export const basePath = derived([isStudentExperience, currentOrgPath], ([$isStudent, $orgPath]) =>
  $isStudent ? '/lms' : $orgPath
);
