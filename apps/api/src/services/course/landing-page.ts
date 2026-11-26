import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourse } from '@cio/core/services/course/course';
import { toCourseLandingPage } from '@api/utils/course-landing-page';

/**
 * Loads a published course by slug for its public landing page. Throws a 404 `AppError` when the
 * course is missing, unpublished or private.
 */
export async function getCourseLandingPage(slug: string) {
  const course = await getCourse(undefined, slug);

  if (!course.isPublished || course.isPrivate) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return toCourseLandingPage(course);
}
