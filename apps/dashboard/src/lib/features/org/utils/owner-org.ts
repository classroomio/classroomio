import { mediaUploadManager } from '$features/media/api';
import { setTheme } from '$lib/utils/functions/theme';
import { currentOrg, mergeAccountOrgFromServer } from '$lib/utils/store/org';
import type { AccountOrg } from '$features/app/types';

import { findOwnerOrgToSwitch } from './owner-org-utils';

/**
 * Makes the org that owns the open course or cohort the current org, so org-scoped requests carry its id.
 * Waits while media uploads run, because changing the current org cancels them.
 */
export function switchToOwnerOrg(
  ownerOrgId: string | null | undefined,
  currentOrgId: string | undefined,
  accountOrgs: AccountOrg[]
) {
  if (mediaUploadManager.isUploading) return;

  const ownerOrg = findOwnerOrgToSwitch(ownerOrgId, currentOrgId, accountOrgs);
  if (!ownerOrg) return;

  if (ownerOrg.siteName) {
    localStorage.setItem('classroomio_org_sitename', ownerOrg.siteName);
  }

  currentOrg.set(mergeAccountOrgFromServer(ownerOrg));
  setTheme(ownerOrg.theme || 'blue');
}
