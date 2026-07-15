import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  calcCourseProgressPercent,
  isBeforeOrEqualDeadline,
  scheduleCertificationCompletionWork
} from '@api/utils/course-completion';
import {
  exerciseBelongsToCourse,
  getExerciseTitleAndMaxPoints,
  getStudentSubmissionsForExercise
} from '@cio/db/queries/course/certification-exercise';
import {
  getCourseById,
  getCourseCertificationRow,
  getCourseProgress as getCourseProgressQuery,
  type TCourseCertificationRow
} from '@cio/db/queries/course/course';
import { claimMemberCertificateEarned } from '@cio/db/queries/course/people';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { PLAN } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';
import { trackServerEvent, SERVER_EVENTS } from '@cio/analytics';

export type CertificationBlocker = {
  code:
    | 'CERT_PROGRESS'
    | 'CERT_DEADLINE_PASSED'
    | 'CERT_NO_CONTENT'
    | 'CERT_FINAL_EXERCISE_NOT_SUBMITTED'
    | 'CERT_FINAL_EXERCISE_PENDING_GRADE'
    | 'CERT_FINAL_EXERCISE_SCORE'
    | 'CERT_FINAL_EXERCISE_MISCONFIGURED';
  params?: Record<string, string | number>;
};

export type CourseCompletionEvaluation = {
  progressPercent: number;
  certificationThreshold: number;
  meetsThreshold: boolean;
  eligibleForCertificate: boolean;
  certificateEarnedAt: string | null;
  blockers: CertificationBlocker[];
  meetsFinalExerciseRule: boolean;
};

function percentFromTotal(total: number, maxPoints: number): number {
  if (maxPoints <= 0) return 0;
  return Math.round((total / maxPoints) * 100);
}

async function evaluateFinalExerciseRule(params: {
  courseId: string;
  requiredExerciseId: string | null | undefined;
  minScorePercent: number | null | undefined;
  groupMemberId: string | null;
}): Promise<{
  meetsFinalExerciseRule: boolean;
  blockers: CertificationBlocker[];
}> {
  const { courseId, requiredExerciseId, minScorePercent, groupMemberId } = params;

  if (!requiredExerciseId) {
    return { meetsFinalExerciseRule: true, blockers: [] };
  }

  const belongs = await exerciseBelongsToCourse(requiredExerciseId, courseId);
  if (!belongs) {
    return { meetsFinalExerciseRule: true, blockers: [] };
  }

  const requiredPercent = minScorePercent ?? 100;

  if (!groupMemberId) {
    return {
      meetsFinalExerciseRule: false,
      blockers: [{ code: 'CERT_FINAL_EXERCISE_NOT_SUBMITTED' }]
    };
  }

  const { title: exerciseTitle, maxPoints } = await getExerciseTitleAndMaxPoints(requiredExerciseId);

  if (maxPoints <= 0) {
    return {
      meetsFinalExerciseRule: false,
      blockers: [
        {
          code: 'CERT_FINAL_EXERCISE_MISCONFIGURED',
          params: { exerciseTitle }
        }
      ]
    };
  }

  const submissions = await getStudentSubmissionsForExercise(groupMemberId, requiredExerciseId);

  if (submissions.length === 0) {
    return {
      meetsFinalExerciseRule: false,
      blockers: [
        {
          code: 'CERT_FINAL_EXERCISE_NOT_SUBMITTED',
          params: { exerciseTitle }
        }
      ]
    };
  }

  const completed = submissions.filter((s) => s.gradingState === 'completed');
  if (completed.length === 0) {
    return {
      meetsFinalExerciseRule: false,
      blockers: [
        {
          code: 'CERT_FINAL_EXERCISE_PENDING_GRADE',
          params: { exerciseTitle }
        }
      ]
    };
  }

  let bestPercent = 0;
  for (const s of completed) {
    const total = Number(s.total ?? 0);
    const p = percentFromTotal(total, maxPoints);
    if (p > bestPercent) bestPercent = p;
  }

  if (bestPercent < requiredPercent) {
    return {
      meetsFinalExerciseRule: false,
      blockers: [
        {
          code: 'CERT_FINAL_EXERCISE_SCORE',
          params: {
            exerciseTitle,
            bestPercent,
            requiredPercent
          }
        }
      ]
    };
  }

  return { meetsFinalExerciseRule: true, blockers: [] };
}

async function buildCertificationEvaluation(
  courseId: string,
  profileId: string,
  courseRow: TCourseCertificationRow,
  progressArg?: Awaited<ReturnType<typeof getCourseProgressQuery>>
): Promise<CourseCompletionEvaluation> {
  const progress = progressArg ?? (await getCourseProgressQuery(courseId, profileId));
  const certificate = courseRow.certificate ?? {};
  const complianceMinScore = courseRow.type === 'COMPLIANCE' ? (courseRow.compliance?.passingScore ?? null) : null;

  const threshold = certificate.threshold ?? 100;
  const progressPercent = calcCourseProgressPercent({
    lessonsCompleted: progress.lessonsCompleted,
    totalLessons: progress.lessonsCount,
    exercisesCompleted: progress.exercisesCompleted,
    exercisesCount: progress.exercisesCount
  });

  const now = new Date();
  const meetsThreshold = progressPercent >= threshold;
  const withinDeadline = isBeforeOrEqualDeadline(certificate.deadline, now);
  const hasContent = progress.lessonsCount + progress.exercisesCount > 0;

  const blockers: CertificationBlocker[] = [];

  if (!withinDeadline) {
    blockers.push({ code: 'CERT_DEADLINE_PASSED' });
  }
  if (!meetsThreshold) {
    blockers.push({
      code: 'CERT_PROGRESS',
      params: { current: progressPercent, required: threshold }
    });
  }
  if (!hasContent) {
    blockers.push({ code: 'CERT_NO_CONTENT' });
  }

  const finalEval = await evaluateFinalExerciseRule({
    courseId,
    requiredExerciseId: certificate.requiredExerciseId,
    minScorePercent: certificate.exerciseMinScorePercent ?? complianceMinScore,
    groupMemberId: progress.groupMemberId
  });

  blockers.push(...finalEval.blockers);

  const eligibleForCertificate =
    progress.roleId === ROLE.STUDENT &&
    !!progress.groupMemberId &&
    meetsThreshold &&
    hasContent &&
    withinDeadline &&
    finalEval.meetsFinalExerciseRule;

  return {
    progressPercent,
    certificationThreshold: threshold,
    meetsThreshold,
    eligibleForCertificate,
    certificateEarnedAt: progress.certificateEarnedAt,
    blockers,
    meetsFinalExerciseRule: finalEval.meetsFinalExerciseRule
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
 * Free-plan orgs do not get certificates: no earned record, no completion email.
 * Self-hosted deployments always have certificates enabled.
 */
async function orgHasCertificatesEnabled(orgId: string): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return true;

  const activePlan = await getActiveOrganizationPlan(orgId);

  return Boolean(activePlan && activePlan.planName !== PLAN.BASIC);
}

/**
 * Server-side guard for PDF certificate download (must match dashboard eligibility).
 */
export async function assertCertificateDownloadAllowed(courseId: string, profileId: string): Promise<void> {
  const evaluation = await evaluateCourseCertification(courseId, profileId);

  const [courseRow] = await getCourseById(courseId);

  if (!courseRow?.certificate?.isDownloadable) {
    throw new AppError('Certificate download is not enabled for this course', ErrorCodes.VALIDATION_ERROR, 403);
  }

  const hasEarnedPreviously = evaluation.certificateEarnedAt != null;
  const canDownload = hasEarnedPreviously || evaluation.eligibleForCertificate;

  if (!canDownload) {
    throw new AppError('Course completion requirements not met', ErrorCodes.VALIDATION_ERROR, 403);
  }
}
