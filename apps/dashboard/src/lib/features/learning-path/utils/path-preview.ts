import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { snackbar } from '$features/ui/snackbar/store';
import { accountApi } from '$features/account/api/account.svelte';
import { currentOrg, getOrgHandoffOrigin, getOrgPublicOrigin } from '$lib/utils/store/org';

interface OpenPathPreviewOptions {
  pathId: string;
  pathSlug?: string | null;
  currentOrgDomain?: string;
}

interface ViewPathAsStudentOptions {
  pathId?: string | null;
  pathSlug?: string | null;
}

/** Absolute URL for the org-site public path page (`/path/{slug}`). Client-only. */
export function getPublicPathPageUrl(pathSlug: string, currentOrgDomain = ''): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const trimmedDomain = currentOrgDomain?.trim();
  const origin = trimmedDomain || getOrgPublicOrigin(get(currentOrg));

  return new URL(`/learning-paths/${pathSlug}`, origin).toString();
}

export function openPathPreview({ pathId, pathSlug, currentOrgDomain = '' }: OpenPathPreviewOptions) {
  if (!pathSlug) {
    snackbar.info('learningPath.workspace.preview_missing_slug');

    if (pathId) {
      goto(`/paths/${pathId}/settings`);
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

/**
 * "View as student" handoff for a path. Mirrors the course flow: mints a login-link
 * token and signs the user in on the org handoff origin before opening the path page.
 */
export async function viewPathAsStudent({ pathId, pathSlug }: ViewPathAsStudentOptions) {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!pathSlug) {
    snackbar.info('learningPath.workspace.preview_missing_slug');

    if (pathId) {
      goto(`/paths/${pathId}/settings`);
    }

    return false;
  }

  const handoffOrigin = getOrgHandoffOrigin(get(currentOrg));
  if (!handoffOrigin) {
    snackbar.error('snackbar.view_as_student.failed');

    return false;
  }

  const token = await accountApi.createLoginLinkToken();
  if (!token) {
    snackbar.error('snackbar.view_as_student.failed');

    return false;
  }

  const loginLinkUrl = new URL('/api/auth/login-link', handoffOrigin);
  loginLinkUrl.searchParams.set('token', token);
  loginLinkUrl.searchParams.set('redirect', `/learning-paths/${pathSlug}`);

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
