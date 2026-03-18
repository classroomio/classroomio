import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';

interface OpenCoursePreviewOptions {
  courseId: string;
  courseSlug?: string | null;
  currentOrgDomain?: string;
}

export function openCoursePreview({ courseId, courseSlug, currentOrgDomain = '' }: OpenCoursePreviewOptions) {
  if (!courseSlug) {
    snackbar.info('course.header.preview_missing_slug');

    if (courseId) {
      goto(resolve(`/courses/${courseId}/settings`, {}));
    }

    return false;
  }

  const origin = currentOrgDomain || window.location.origin;
  const link = new URL(resolve(`/course/${courseSlug}`, {}), origin).toString();

  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
}
