import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';

interface OpenCoursePreviewOptions {
  courseId: string;
  courseSlug?: string | null;
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
