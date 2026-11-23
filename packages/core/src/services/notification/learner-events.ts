import { getLearnerGoal } from '@cio/db/queries/learner/goals';
import { getAssignmentAvailabilityState, getCourseRecommendationAudience } from '@cio/db/queries/learner/recipients';
import { isAssignmentOpenToStudents } from '@cio/utils/functions/assignment-availability';
import { getCourseOrganization, getCourseStudentAudience } from '@cio/db/queries/notifications/notification-recipients';

import { getLearnerGoalSummary } from '../learner/goals';
import { notify } from './notify';

async function safely(event: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`notification event ${event} failed:`, error);
  }
}

/**
 * Tells the course's students about an exercise that was just assigned or unlocked; once per exercise. Nothing is
 * sent, and the once-per-exercise key stays unused, while students cannot open it yet (draft course or locked lesson).
 */
export function notifyAssignmentAvailable(params: {
  exerciseId: string;
  courseId: string;
  actorProfileId?: string | null;
}) {
  return safely('assignment_new', async () => {
    const state = await getAssignmentAvailabilityState(params.exerciseId, params.courseId);
    if (!state || !isAssignmentOpenToStudents(state)) return;

    const audience = await getCourseStudentAudience(params.courseId);
    if (!audience) return;

    await notify({
      organizationId: audience.organizationId,
      recipientProfileIds: audience.studentProfileIds,
      type: 'assignment_new',
      entityId: params.exerciseId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `assignment_new:${params.exerciseId}`
    });
  });
}

/** Suggests a newly published catalog course to the organization's students who are not in it; once per course. */
export function notifyCourseRecommended(params: { courseId: string; actorProfileId?: string | null }) {
  return safely('course_recommended', async () => {
    const audience = await getCourseRecommendationAudience(params.courseId);
    if (!audience) return;

    await notify({
      organizationId: audience.organizationId,
      recipientProfileIds: audience.profileIds,
      type: 'course_recommended',
      entityId: params.courseId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `course_recommended:${params.courseId}`
    });
  });
}

/**
 * After a lesson completion, tells a learner who set up their goals that they reached this week's lesson goal; once
 * per learner per week.
 */
export function notifyWeeklyGoalProgress(params: { courseId: string; profileId: string }) {
  return safely('weekly_goal_reached', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    const goal = await getLearnerGoal(params.profileId, organizationId);
    if (!goal) return;

    const summary = await getLearnerGoalSummary({ organizationId, profileId: params.profileId });
    if (!summary.weeklyGoal.isReached) return;

    await notify({
      organizationId,
      recipientProfileIds: [params.profileId],
      type: 'weekly_goal_reached',
      entityId: goal.id,
      dedupeKey: `weekly_goal_reached:${goal.id}:${summary.weeklyGoal.weekStart}`
    });
  });
}
