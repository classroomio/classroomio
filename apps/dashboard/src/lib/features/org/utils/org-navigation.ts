import { accountApi } from '$features/account/api/account.svelte';
import type { AccountOrg } from '$features/app/types';
import { mediaUploadManager } from '$features/media/api';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { setTheme } from '$lib/utils/functions/theme';
import { currentOrg, getOrgPublicOrigin, getOrgPublicUrl, mergeAccountOrgFromServer } from '$lib/utils/store/org';
import { STUDENT_HOME_ENTRY_PATH } from '@cio/utils/lms';

const LAST_ORG_SITENAME_KEY = 'classroomio_org_sitename';

type OrgSiteDestination = Pick<AccountOrg, 'siteName' | 'customDomain' | 'isCustomDomainVerified'>;

function confirmLeavingUploads(): boolean {
  if (!mediaUploadManager.isUploading) {
    return true;
  }

  return window.confirm(t.get('media_manager.upload.switch_organization_confirm'));
}

function cancelUploads(): void {
  if (mediaUploadManager.isUploading) {
    mediaUploadManager.cancelAll();
  }
}

/**
 * Makes `org` the active admin org and reloads into its dashboard. Returns false when the user
 * keeps their in-progress uploads instead.
 */
export function switchToManagedOrg(org: AccountOrg): boolean {
  if (!org.siteName || !confirmLeavingUploads()) {
    return false;
  }

  cancelUploads();
  localStorage.setItem(LAST_ORG_SITENAME_KEY, org.siteName);
  currentOrg.set(mergeAccountOrgFromServer(org));
  setTheme(org.theme || 'blue');
  window.location.href = `/org/${org.siteName}`;

  return true;
}

/**
 * Opens the academy's student home on its own site. When that site is on another host, the user is
 * signed in there through a login-link handoff because sessions do not cross hosts.
 */
export async function openLearnerOrg(org: OrgSiteDestination): Promise<boolean> {
  if (!confirmLeavingUploads()) {
    return false;
  }

  const origin = getOrgPublicOrigin(org);
  if (!origin || origin === window.location.origin) {
    cancelUploads();
    window.location.href = getOrgPublicUrl(org, STUDENT_HOME_ENTRY_PATH);

    return true;
  }

  const token = await accountApi.createLoginLinkToken();
  if (!token) {
    snackbar.error('snackbar.org_switcher.open_academy_failed');

    return false;
  }

  cancelUploads();
  const loginLinkUrl = new URL('/api/auth/login-link', origin);
  loginLinkUrl.searchParams.set('token', token);
  loginLinkUrl.searchParams.set('redirect', STUDENT_HOME_ENTRY_PATH);
  window.location.href = loginLinkUrl.toString();

  return true;
}

/** Host of the org's public site, shown so users can tell where an org lives. */
export function getOrgSiteHost(org: OrgSiteDestination): string {
  const origin = getOrgPublicOrigin(org);
  if (!origin) {
    return '';
  }

  return new URL(origin).host;
}
