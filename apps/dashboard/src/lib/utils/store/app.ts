import { currentOrg, currentOrgPath } from './org';
import { derived, writable } from 'svelte/store';

import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { ROLE } from '@cio/utils/constants';

export const globalStore = writable<{
  isDark: boolean;
  isOrgSite: boolean;
  orgSiteName: string;
}>({
  isDark: false,
  isOrgSite: false,
  orgSiteName: ''
});

export const isOrgStudent = derived(currentOrg, ($currentOrg) => {
  if ($currentOrg.roleId === 0) return null;

  return $currentOrg.roleId === ROLE.STUDENT;
});

/**
 * Cloud: orgSite is always student (a teacher on an org subdomain sees the student view).
 * Self-hosted: derived from isOrgStudent (role-based).
 */
export const isStudentExperience = derived([globalStore, isOrgStudent], ([$gs, $isStudent]) => {
  const isCloud = PUBLIC_IS_SELFHOSTED !== 'true';
  if (isCloud) return $gs.isOrgSite;

  return $isStudent ?? false;
});

/**
 * The root path for navigation: '/lms' for students, '/org/{siteName}' for admin/teacher
 */
export const basePath = derived([isStudentExperience, currentOrgPath], ([$isStudent, $orgPath]) =>
  $isStudent ? '/lms' : $orgPath
);
