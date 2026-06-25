import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseById, getCourseWithOrgData } from '@cio/db/queries/course';
import { getExerciseById } from '@cio/db/queries/exercise';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { QUEUE_NAMES, enqueueNotifyCourseExercise, getQueueJobEnvelope, type JobEnvelope } from '@cio/jobs';

const NOTIFY_DOMAIN = 'notify-course-exercise';

/**
 * Enqueue a background job that emails every course member a "quiz assigned"
 * nudge with a deep link to take the exercise. Returns the job id the
 * dashboard polls for completion.
 */
export async function notifyCourseExerciseService(courseId: string, exerciseId: string): Promise<{ jobId: string }> {
  const [courseRows, orgData, exercise] = await Promise.all([
    getCourseById(courseId),
    getCourseWithOrgData(courseId),
    getExerciseById(exerciseId)
  ]);

  const course = courseRows?.[0];

  if (!course) {
    throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (!orgData) {
    throw new AppError('Course organization not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (!exercise || exercise.courseId !== courseId) {
    throw new AppError('Exercise not found for this course', ErrorCodes.NOT_FOUND, 404);
  }

  const baseUrl = getDashboardBaseUrl({
    siteName: orgData.orgSiteName,
    customDomain: orgData.orgCustomDomain,
    isCustomDomainVerified: orgData.orgIsCustomDomainVerified
  });

  // PUBLIC courses are taken on the anonymous slug-based org-site route;
  // every other type uses the authenticated id-based LMS route.
  let quizUrl: string;
  if (course.type === 'PUBLIC') {
    if (!course.slug || !exercise.slug) {
      throw new AppError('Public course/exercise is missing a slug to link to', ErrorCodes.VALIDATION_ERROR, 400);
    }

    quizUrl = `${baseUrl}/course/${course.slug}/lesson/${exercise.slug}`;
  } else {
    quizUrl = `${baseUrl}/courses/${courseId}/exercises/${exerciseId}`;
  }

  const orgName = orgData.orgName || 'ClassroomIO';

  const jobId = await enqueueNotifyCourseExercise({
    courseId,
    exerciseTitle: exercise.title,
    courseName: course.title,
    orgName,
    fromName: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
    quizUrl,
    branding: buildEmailBranding({
      name: orgData.orgName,
      avatarUrl: orgData.orgAvatarUrl,
      theme: orgData.orgTheme
    })
  });

  if (!jobId) {
    throw new AppError('Failed to enqueue notification job', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return { jobId };
}

/**
 * Read the status of a notify job (BullMQ-backed envelope). Throws 404 if the
 * job is gone (retention swept it).
 */
export async function getNotifyCourseExerciseStatusService(jobId: string, pollCount = 0): Promise<JobEnvelope> {
  const envelope = await getQueueJobEnvelope(QUEUE_NAMES.notifications, jobId, NOTIFY_DOMAIN, pollCount);

  if (!envelope) {
    throw new AppError('Notification job not found', ErrorCodes.NOT_FOUND, 404);
  }

  return envelope;
}
