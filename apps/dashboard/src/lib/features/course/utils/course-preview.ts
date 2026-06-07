import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';
import { accountApi } from '$features/account/api/account.svelte';

interface OpenCoursePreviewOptions {
  courseId: string;
  courseSlug?: string | null;
  currentOrgDomain?: string;
}

interface ViewAsStudentOptions {
  courseId?: string | null;
  currentOrgDomain?: string;
}

/** Absolute URL for the org-site public course page (`/course/{slug}`). Client-only. */
export function getPublicCoursePageUrl(courseSlug: string, currentOrgDomain = ''): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const trimmedDomain = currentOrgDomain?.trim();
  const origin = trimmedDomain || window.location.origin;

  return new URL(resolve(`/course/${courseSlug}`, {}), origin).toString();
}

export function openCoursePreview({ courseId, courseSlug, currentOrgDomain = '' }: OpenCoursePreviewOptions) {
  if (!courseSlug) {
    snackbar.info('course.header.preview_missing_slug');

    if (courseId) {
      goto(resolve(`/courses/${courseId}/settings`, {}));
    }

    return false;
  }

  const link = getPublicCoursePageUrl(courseSlug, currentOrgDomain);

  if (!link) {
    return false;
  }

  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * "View as student" handoff. Mints a short-lived login-link token for the current
 * user and navigates to the org domain's `/api/auth/login-link`, which signs them in
 * there (host-only session) and redirects to the course's student view.
 *
 * One flow for cloud and self-hosted: on cloud the tenant-router worker fronts
 * `/api/auth/*`→API and `/course/*`→dashboard under the tenant host; on self-hosted the
 * dashboard's own `hooks.server.ts` proxies `/api/auth/*` to the API. Either way the
 * cookie lands on `currentOrgDomain` and the relative `redirect` resolves there.
 */
export async function viewAsStudent({ courseId, currentOrgDomain = '' }: ViewAsStudentOptions) {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!courseId) {
    return false;
  }

  const token = await accountApi.createViewAsStudentToken();
  if (!token) {
    snackbar.error('snackbar.view_as_student.failed');

    return false;
  }

  const origin = currentOrgDomain?.trim() || window.location.origin;
  const loginLinkUrl = new URL('/api/auth/login-link', origin);
  loginLinkUrl.searchParams.set('token', token);
  loginLinkUrl.searchParams.set('redirect', `/courses/${courseId}/lessons?next=true`);

  // Cross-origin handoff — open in a new tab so the teacher keeps their dashboard.
  window.open(loginLinkUrl.toString(), '_blank', 'noopener,noreferrer');

  return true;
}

export async function copyPublicCoursePageUrl(courseSlug: string, currentOrgDomain = '') {
  const url = getPublicCoursePageUrl(courseSlug, currentOrgDomain);

  if (!url) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(url);
    snackbar.success('snackbar.public_course.url_copied');

    return true;
  } catch (error) {
    console.error('copyPublicCoursePageUrl error:', error);
    snackbar.error('snackbar.public_course.url_copy_failed');

    return false;
  }
}
