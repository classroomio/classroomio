import { generateSlug } from '@cio/utils/functions';
import { isObject } from '$lib/utils/functions/isObject';
import { courseApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { Course } from '$features/course/utils/types';
import { isCourseMissingComplianceDeadline } from './compliance-deadline';

export type PublishCourseResult = { ok: true } | { ok: false; reason: 'missing_deadline' | 'failed' };

export async function publishCourse(course: Course): Promise<PublishCourseResult> {
  if (!course?.id) {
    return { ok: false, reason: 'failed' };
  }

  if (isCourseMissingComplianceDeadline(course)) {
    return { ok: false, reason: 'missing_deadline' };
  }

  if (Number(course.cost) > 0 && !(course.metadata?.paymentLink ?? '').trim()) {
    snackbar.error('course.navItem.landing_page.editor.pricing_form.payment_required');
    return false;
  }

  let slug = course.slug?.trim() ? course.slug : undefined;
  if (!slug) {
    slug = generateSlug(course.title, { appendTimestamp: true });
  }

  const metadataPayload = {
    ...(isObject(course.metadata) ? course.metadata : {}),
    allowNewStudent: true
  };

  const result = await courseApi.update(
    course.id,
    {
      isPublished: true,
      slug,
      metadata: metadataPayload
    },
    { showSuccessToast: true }
  );

  if (!result) {
    if (courseApi.errors['certificate.deadline']) {
      return { ok: false, reason: 'missing_deadline' };
    }

    return { ok: false, reason: 'failed' };
  }

  return { ok: true };
}
