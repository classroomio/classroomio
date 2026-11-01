import { AppError, ErrorCodes } from '@api/utils/errors';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getExploreCourseDetail } from '@cio/db/queries/course/explore';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions';
import { isCoursePaid } from '@cio/utils/validation/course';

function discountedPrice(cost: number, discountPercent: number, showDiscount: boolean) {
  if (!discountPercent || !showDiscount) return cost;

  return Math.round(cost - (discountPercent / 100) * cost);
}

/**
 * Landing details for a course a learner can open from Explore: a published course of the organization they are
 * enrolled in or may enroll in themselves. Paid courses report `requiresPayment` and the web landing page that
 * handles checkout; free ones are joined with `POST /course/:courseId/enroll`.
 */
export async function getExploreCourse(orgId: string, profileId: string, courseId: string) {
  const row = await getExploreCourseDetail({ orgId, profileId, courseId });
  if (!row) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const { course, organization } = row;
  const isEnrolled = row.groupMemberId !== null;
  const allowsSelfEnrollment = isSelfEnrollmentAllowed(course.metadata);
  if (!isEnrolled && !allowsSelfEnrollment) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const cost = Number(course.cost ?? 0);
  const requiresPayment = isCoursePaid(cost, course.metadata);
  const showDiscount = course.metadata?.showDiscount ?? false;
  const discountPercent = course.metadata?.discount ?? 0;
  const price = requiresPayment ? discountedPrice(cost, discountPercent, showDiscount) : 0;
  const baseUrl = getDashboardBaseUrl(organization);
  const landingUrl = course.slug ? `${baseUrl}/course/${course.slug}` : null;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    overview: course.overview,
    requirements: course.metadata?.requirements || null,
    goals: course.metadata?.goals || null,
    bannerImage: course.bannerImage,
    type: course.type,
    lessonCount: row.lessonCount,
    exerciseCount: row.exerciseCount,
    currency: course.currency,
    cost,
    price,
    hasDiscount: requiresPayment && showDiscount && discountPercent > 0,
    requiresPayment,
    allowsSelfEnrollment,
    canEnrollInApp: !isEnrolled && allowsSelfEnrollment && !requiresPayment,
    isEnrolled,
    landingUrl
  };
}
