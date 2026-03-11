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
