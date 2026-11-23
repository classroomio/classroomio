import {
  filterProfilesByOrganizationRole,
  getOrganizationAdminProfileIds
} from '@cio/db/queries/organization/insights';
import { getCourseOrganization, getGroupMemberProfileIds } from '@cio/db/queries/notifications/notification-recipients';
import { listCourseTutorProfileIds } from '@cio/db/queries/teaching/sessions';
import { ROLE } from '@cio/utils/constants/roles';

import { notify } from './notify';

async function safely(event: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`notification event ${event} failed:`, error);
  }
}

async function courseTutors(courseId: string): Promise<string[]> {
  const byCourse = await listCourseTutorProfileIds([courseId]);

  return byCourse.get(courseId) ?? [];
}

/** Tells the course's tutors that a learner submitted an exercise. */
export function notifySubmissionReceived(params: {
  submissionId: string;
  courseId: string;
  submittedByGroupMemberId: string;
}) {
  return safely('submission_received', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    const [tutors, profileByMember] = await Promise.all([
      courseTutors(params.courseId),
      getGroupMemberProfileIds([params.submittedByGroupMemberId])
    ]);

    await notify({
      organizationId,
      recipientProfileIds: tutors,
      type: 'submission_received',
      entityId: params.submissionId,
      courseId: params.courseId,
      actorProfileId: profileByMember.get(params.submittedByGroupMemberId) ?? null,
      dedupeKey: `submission_received:${params.submissionId}`
    });
  });
}

/** Tells the course's tutors that a student joined the course. */
export function notifyStudentJoined(params: { courseId: string; studentProfileId: string }) {
  return safely('student_joined', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    await notify({
      organizationId,
      recipientProfileIds: await courseTutors(params.courseId),
      type: 'student_joined',
      entityId: params.courseId,
      courseId: params.courseId,
      actorProfileId: params.studentProfileId,
      dedupeKey: `student_joined:${params.courseId}:${params.studentProfileId}`
    });
  });
}

/** Tells tutors they were added to a course's team. Org admins added to a team are not notified. */
export function notifyTutorAdded(params: { courseId: string; profileIds: string[]; actorProfileId?: string | null }) {
  return safely('tutor_added', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    const tutors = await filterProfilesByOrganizationRole(organizationId, params.profileIds, ROLE.TUTOR);

    await notify({
      organizationId,
      recipientProfileIds: tutors,
      type: 'tutor_added',
      entityId: params.courseId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `tutor_added:${params.courseId}`
    });
  });
}

/** Sends a learner the reminder a tutor asked for. `nudgeId` keys the notification to that one nudge. */
export function notifyLearnerNudged(params: {
  organizationId: string;
  courseId: string;
  learnerProfileId: string;
  actorProfileId: string;
  nudgeId: string;
}) {
  return safely('learner_nudged', () =>
    notify({
      organizationId: params.organizationId,
      recipientProfileIds: [params.learnerProfileId],
      type: 'learner_nudged',
      entityId: params.courseId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `learner_nudged:${params.nudgeId}`
    })
  );
}

/** Tells the organization's admins it crossed half of, or reached, its plan's student limit. Once per milestone. */
export function notifyStudentLimitMilestone(params: { organizationId: string; milestone: 'half' | 'reached' }) {
  return safely('student_limit', async () => {
    const type = params.milestone === 'reached' ? 'student_limit_reached' : 'student_limit_approaching';

    await notify({
      organizationId: params.organizationId,
      recipientProfileIds: await getOrganizationAdminProfileIds(params.organizationId),
      type,
      entityId: params.organizationId,
      dedupeKey: `${type}:${params.organizationId}`
    });
  });
}

/** Tells the organization's admins a plan payment failed. `failureKey` identifies the failure, so retries add nothing. */
export function notifyPaymentFailed(params: { organizationId: string; failureKey: string }) {
  return safely('payment_failed', async () => {
    await notify({
      organizationId: params.organizationId,
      recipientProfileIds: await getOrganizationAdminProfileIds(params.organizationId),
      type: 'payment_failed',
      entityId: params.organizationId,
      dedupeKey: `payment_failed:${params.failureKey}`
    });
  });
}

/** Tells the organization's admins a webhook started failing or was turned off, once per triggering delivery. */
export function notifyWebhookHealth(params: {
  organizationId: string;
  webhookId: string;
  transition: 'degraded' | 'disabled';
  deliveryId: string;
}) {
  return safely('webhook_health', async () => {
    const type = params.transition === 'disabled' ? 'webhook_disabled' : 'webhook_failing';

    await notify({
      organizationId: params.organizationId,
      recipientProfileIds: await getOrganizationAdminProfileIds(params.organizationId),
      type,
      entityId: params.webhookId,
      dedupeKey: `${type}:${params.deliveryId}`
    });
  });
}
