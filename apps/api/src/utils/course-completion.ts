import { getDashboardBaseUrl } from '@api/config/dashboard-url';
import {
  getCourseProgress as getCourseProgressQuery,
  type TCourseCertificationRow
} from '@cio/db/queries/course/course';
import { setMemberCertificateEarned, setMemberCertificationEmailSent } from '@cio/db/queries/course/people';
import { getProfileById } from '@cio/db/queries/auth';
import { buildEmailFromName } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';

export function calcCourseProgressPercent(params: {
  lessonsCompleted: number;
  totalLessons: number;
  exercisesCompleted: number;
  exercisesCount: number;
}): number {
  const totalItems = params.totalLessons + params.exercisesCount;

  if (totalItems === 0) return 0;

  const completedItems = params.lessonsCompleted + params.exercisesCompleted;

  return Math.round((completedItems / totalItems) * 100);
}

export function isBeforeOrEqualDeadline(deadlineIso: string | null | undefined, now: Date): boolean {
  if (!deadlineIso) return true;

  const deadlineDate = new Date(deadlineIso);

  if (Number.isNaN(deadlineDate.getTime())) return true;

  return now.getTime() <= deadlineDate.getTime();
}

/**
 * Persists certificate earned time, then sends the completion email and records
 * {@link setMemberCertificationEmailSent}, without blocking the HTTP handler.
 * Re-fetches progress so concurrent jobs can skip work already done.
 */
export function scheduleCertificationCompletionWork(params: {
  courseId: string;
  profileId: string;
  groupMemberId: string;
  courseRow: TCourseCertificationRow;
  earnedAt: string;
}): void {
  const { courseId, profileId, groupMemberId, courseRow, earnedAt } = params;

  void (async () => {
    try {
      let latest = await getCourseProgressQuery(courseId, profileId);

      if (!latest.certificateEarnedAt) {
        await setMemberCertificateEarned(groupMemberId, earnedAt);
        latest = await getCourseProgressQuery(courseId, profileId);
      }

      if (latest.certificationEmailSentAt) {
        return;
      }

      const profile = await getProfileById(profileId);
      const studentEmail = profile?.email;

      if (!studentEmail) {
        return;
      }

      const base = getDashboardBaseUrl(courseRow.orgSiteName ?? undefined);
      const certificateUrl = `${base}/courses/${courseId}/certificates`;

      await enqueueTransactionalEmail('studentCourseCompletion', {
        to: studentEmail,
        fields: {
          orgName: courseRow.orgName,
          courseName: courseRow.title,
          studentName: profile?.fullname || studentEmail,
          certificateUrl,
          customMessage: courseRow.certificate?.emailMessage ?? null
        },
        from: buildEmailFromName(`${courseRow.orgName} (via ClassroomIO.com)`),
        idempotencyKey: `course-completion:${groupMemberId}`
      });

      await setMemberCertificationEmailSent(groupMemberId, new Date().toISOString());
    } catch (error) {
      console.error('scheduleCertificationCompletionWork: failed:', error);
    }
  })();
}
