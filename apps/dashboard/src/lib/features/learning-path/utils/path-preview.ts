import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';
import { accountApi } from '$features/account/api/account.svelte';
import { currentOrg, getOrgPublicOrigin } from '$lib/utils/store/org';

interface OpenPathPreviewOptions {
  pathId: string;
  pathSlug?: string | null;
  currentOrgDomain?: string;
}

interface ViewPathAsStudentOptions {
  pathId?: string | null;
  pathSlug?: string | null;
  currentOrgDomain?: string;
}

/** Absolute URL for the org-site public path page (`/path/{slug}`). Client-only. */
export function getPublicPathPageUrl(pathSlug: string, currentOrgDomain = ''): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const trimmedDomain = currentOrgDomain?.trim();
  const origin = trimmedDomain || getOrgPublicOrigin(get(currentOrg));

  return new URL(resolve(`/path/${pathSlug}`, {}), origin).toString();
}

export function openPathPreview({ pathId, pathSlug, currentOrgDomain = '' }: OpenPathPreviewOptions) {
  if (!pathSlug) {
    snackbar.info('learningPath.workspace.preview_missing_slug');

    if (pathId) {
      goto(resolve(`/paths/${pathId}/settings`, {}));
    }

    return false;
  }

  const link = getPublicPathPageUrl(pathSlug, currentOrgDomain);

  if (!link) {
    return false;
  }

  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
}

export async function viewPathAsStudent({ pathId, pathSlug, currentOrgDomain = '' }: ViewPathAsStudentOptions) {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!pathId && !pathSlug) {
    return false;
  }

  const token = await accountApi.createViewAsStudentToken();
  if (!token) {
    snackbar.error('snackbar.view_as_student.failed');

    return false;
  }

  const origin = currentOrgDomain?.trim() || getOrgPublicOrigin(get(currentOrg));
  const loginLinkUrl = new URL('/api/auth/login-link', origin);
  loginLinkUrl.searchParams.set('token', token);
  const redirectTarget = pathSlug ? `/path/${pathSlug}` : `/paths/${pathId}`;
  loginLinkUrl.searchParams.set('redirect', redirectTarget);

  // Cross-origin handoff — open in a new tab so the teacher keeps their dashboard.
  window.open(loginLinkUrl.toString(), '_blank', 'noopener,noreferrer');

  return true;
}

export async function copyPublicPathPageUrl(pathSlug: string, currentOrgDomain = '') {
  const url = getPublicPathPageUrl(pathSlug, currentOrgDomain);

  if (!url) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(url);
    snackbar.success('learningPath.workspace.url_copied');

    return true;
  } catch (error) {
    console.error('copyPublicPathPageUrl error:', error);
    snackbar.error('snackbar.public_course.url_copy_failed');

    return false;
  }
}
