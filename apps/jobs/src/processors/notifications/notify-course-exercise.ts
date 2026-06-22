import { getCourseMembers } from '@cio/db/queries/course/people';
import { ZNotifyCourseExercisePayload, enqueueEmailSend } from '@cio/jobs';
import { ROLE } from '@cio/utils/constants';

import { log } from '../../utils/logger';

interface NotifyResult {
  notified: number;
}

/**
 * Process a `notifications:notify-course-exercise` job. Fans out one
 * `quizAssigned` email per course member that has an email, each carrying a
 * deep link to take the quiz. Returns how many emails were enqueued (BullMQ
 * stores this as the job return value for the dashboard poll).
 */
export async function processNotifyCourseExercise(rawPayload: unknown, jobId: string): Promise<NotifyResult> {
  const payload = ZNotifyCourseExercisePayload.parse(rawPayload);

  const members = await getCourseMembers(payload.courseId);
  const recipients = members
    .filter((member) => member.roleId === ROLE.STUDENT)
    .map((member) => member.profile?.email)
    .filter((email): email is string => !!email);

  let notified = 0;
  for (const email of recipients) {
    try {
      await enqueueEmailSend(
        {
          kind: 'template',
          template: 'quizAssigned',
          to: email,
          fields: {
            orgName: payload.orgName,
            courseName: payload.courseName,
            exerciseTitle: payload.exerciseTitle,
            quizUrl: payload.quizUrl,
            branding: payload.branding
          },
          from: payload.fromName
        },
        // Vary by the notify job id so re-running the nudge re-sends.
        { idempotencyKey: `quiz-assigned:${jobId}:${email}` }
      );
      notified += 1;
    } catch (error) {
      log.error('notify-course-exercise-enqueue-failed', { jobId, recipient: email });
      throw error;
    }
  }

  log.info('notify-course-exercise-done', { jobId, courseId: payload.courseId, notified });

  return { notified };
}
