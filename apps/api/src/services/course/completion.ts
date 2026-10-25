import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  calcCourseProgressPercent,
  isBeforeOrEqualDeadline,
  scheduleCertificationCompletionWork
} from '@api/utils/course-completion';
import { REQUIRED_COURSE_COMPLETION_PERCENT } from '@cio/utils/functions/course-progression';
import {
  getCourseById,
  getCourseCertificationRow,
  getCourseProgress as getCourseProgressQuery,
  type TCourseCertificationRow
} from '@cio/db/queries/course/course';
import { claimMemberCertificateEarned } from '@cio/db/queries/course/people';
import { captureServerEvent } from '@cio/core/services/posthog';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { emitWebhookEvent } from '@cio/core/services/webhook/emit';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { trackServerEvent, SERVER_EVENTS } from '@cio/analytics';
import { assertCertificatesEnabled, orgHasCertificatesEnabled } from '@api/services/course/certificate-plan';

export type CertificationBlocker = {
  code: 'CERT_PROGRESS' | 'CERT_DEADLINE_PASSED' | 'CERT_NO_CONTENT';
  params?: Record<string, string | number>;
};

export type CourseCompletionEvaluation = {
  progressPercent: number;
  eligibleForCertificate: boolean;
  certificateEarnedAt: string | null;
  blockers: CertificationBlocker[];
};

async function buildCertificationEvaluation(
  courseId: string,
  profileId: string,
  courseRow: TCourseCertificationRow,
  progressArg?: Awaited<ReturnType<typeof getCourseProgressQuery>>
): Promise<CourseCompletionEvaluation> {
  const progress = progressArg ?? (await getCourseProgressQuery(courseId, profileId));
  const certificate = courseRow.certificate ?? {};

  const progressPercent = calcCourseProgressPercent({
    lessonsCompleted: progress.lessonsCompleted,
    totalLessons: progress.lessonsCount,
    exercisesCompleted: progress.exercisesCompleted,
    exercisesCount: progress.exercisesCount
  });

  const now = new Date();
  const totalContentCount = progress.lessonsCount + progress.exercisesCount;
  const completedContentCount = progress.lessonsCompleted + progress.exercisesCompleted;
  const hasContent = totalContentCount > 0;
  const hasCompletedAllContent = hasContent && completedContentCount >= totalContentCount;
  const withinDeadline = isBeforeOrEqualDeadline(certificate.deadline, now);

  const blockers: CertificationBlocker[] = [];

  if (!withinDeadline) {
    blockers.push({ code: 'CERT_DEADLINE_PASSED' });
  }
  if (!hasCompletedAllContent) {
    blockers.push({
      code: 'CERT_PROGRESS',
      params: { current: progressPercent, required: REQUIRED_COURSE_COMPLETION_PERCENT }
    });
  }
  if (!hasContent) {
    blockers.push({ code: 'CERT_NO_CONTENT' });
  }

  const eligibleForCertificate = !!progress.groupMemberId && hasCompletedAllContent && withinDeadline;

  return {
    progressPercent,
    eligibleForCertificate,
    certificateEarnedAt: progress.certificateEarnedAt,
    blockers
  };
}

/**
 * Evaluates certification eligibility. On first eligibility, persists
 * `certificateEarnedAt` and fires the completion email (non-blocking).
 */
export async function evaluateCourseCertification(
  courseId: string,
  profileId: string
): Promise<CourseCompletionEvaluation & { isNewCompletion: boolean }> {
  const [progress, courseRow] = await Promise.all([
    getCourseProgressQuery(courseId, profileId),
    getCourseCertificationRow(courseId)
  ]);

  if (!courseRow) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const evaluation = await buildCertificationEvaluation(courseId, profileId, courseRow, progress);

  let certificateEarnedAt = evaluation.certificateEarnedAt;
  let isNewCompletion = false;

  if (evaluation.eligibleForCertificate && !certificateEarnedAt && progress.groupMemberId) {
    const certificatesEnabled = await orgHasCertificatesEnabled(courseRow.orgId);

    if (certificatesEnabled) {
      const earnedAt = new Date().toISOString();
      const didClaimCertificate = await claimMemberCertificateEarned(progress.groupMemberId, earnedAt);
      certificateEarnedAt = earnedAt;

      if (didClaimCertificate) {
        isNewCompletion = true;

        captureServerEvent({
          event: 'course_completed',
          distinctId: profileId,
          orgId: courseRow.orgId,
          properties: { course_id: courseId, course_type: courseRow.type }
        });

        await invalidateOrgStats(courseRow.orgId);

        const completionEventData = { profileId, memberId: progress.groupMemberId, completedAt: earnedAt };
        await emitWebhookEvent(courseRow.orgId, 'course.completed', { courseId, ...completionEventData });
        await emitWebhookEvent(courseRow.orgId, 'course.certificate.issued', { courseId, ...completionEventData });

        scheduleCertificationCompletionWork({
          courseId,
          profileId,
          groupMemberId: progress.groupMemberId,
          courseRow,
          earnedAt
        });

        trackServerEvent({
          eventType: SERVER_EVENTS.COURSE_COMPLETED,
          userId: profileId,
          courseId,
          props: { path: 'standard', earnedAt }
        });

        if (courseRow.certificate?.isDownloadable) {
          trackServerEvent({
            eventType: SERVER_EVENTS.CERTIFICATE_ISSUED,
            userId: profileId,
            courseId,
            props: { path: 'standard', earnedAt }
          });
        }
      }
    }
  }

  return { ...evaluation, certificateEarnedAt, isNewCompletion };
}

/**
 * Server-side guard for PDF certificate download (must match dashboard eligibility).
 * Throws 403 UPGRADE_REQUIRED when the org plan does not include certificates.
 */
export async function assertCertificateDownloadAllowed(courseId: string, profileId: string): Promise<void> {
  const evaluation = await evaluateCourseCertification(courseId, profileId);

  const [courseRow] = await getCourseById(courseId);

  if (!courseRow?.certificate?.isDownloadable) {
    throw new AppError('Certificate download is not enabled for this course', ErrorCodes.VALIDATION_ERROR, 403);
  }

  const orgId = await getCourseOrganizationId(courseId);
  if (!orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  await assertCertificatesEnabled(orgId);

  const hasEarnedPreviously = evaluation.certificateEarnedAt != null;
  const canDownload = hasEarnedPreviously || evaluation.eligibleForCertificate;

  if (!canDownload) {
    throw new AppError('Course completion requirements not met', ErrorCodes.VALIDATION_ERROR, 403);
  }
}
