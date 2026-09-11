import { generateSlug } from '@cio/utils/functions';
import { ZPaymentLink } from '@cio/utils/validation/course';
import { isObject } from '$lib/utils/functions/isObject';
import { isCoursePaid } from '$lib/utils/functions/course';
import { courseApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { Course } from '$features/course/utils/types';
import { isCourseMissingComplianceDeadline } from './compliance-deadline';

export type PublishCourseResult = { ok: true } | { ok: false; reason: 'missing_deadline' | 'failed' };

/**
 * Checks whether a paid course is missing the details required to go live
 * (a payment link and a cost greater than 0). Returns a translation key for
 * the error message and a `hasError` boolean so callers can show the message
 * and stop the publish. Free courses always pass.
 */
export function validatePaidCourseForPublish(course: Course): { hasError: boolean; messageKey?: string } {
  if (!isCoursePaid(course)) {
    return { hasError: false };
  }

  const paymentLink = (course.metadata?.paymentLink ?? '').trim();

  if (!paymentLink) {
    return { hasError: true, messageKey: 'course.navItem.landing_page.editor.pricing_form.payment_required' };
  }

  if (!ZPaymentLink.safeParse(paymentLink).success) {
    return { hasError: true, messageKey: 'course.navItem.landing_page.editor.pricing_form.payment_invalid_url' };
  }

  if (Number(course.cost ?? 0) <= 0) {
    return { hasError: true, messageKey: 'course.navItem.landing_page.editor.pricing_form.payment_cost_required' };
  }

  return { hasError: false };
}

export async function publishCourse(course: Course): Promise<PublishCourseResult> {
  if (!course?.id) {
    return { ok: false, reason: 'failed' };
  }

  if (isCourseMissingComplianceDeadline(course)) {
    return { ok: false, reason: 'missing_deadline' };
  }

  const paidCourseCheck = validatePaidCourseForPublish(course);
  if (paidCourseCheck.hasError && paidCourseCheck.messageKey) {
    snackbar.error(paidCourseCheck.messageKey);
    return { ok: false, reason: 'failed' };
  }

  let slug = course.slug?.trim() ? course.slug : undefined;
  if (!slug) {
    slug = generateSlug(course.title, { appendTimestamp: true });
  }

  const metadataPayload = {
    ...(isObject(course.metadata) ? course.metadata : {}),
    allowSelfEnrollment: true
  };

  const result = await courseApi.update(
    course.id,
    {
      isPublished: true,
      slug,
      cost: course.cost ?? 0,
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
