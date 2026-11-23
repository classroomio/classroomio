import { getLearnerGoalSummary } from '@cio/core/services/learner/goals';
import { upsertLearnerGoal } from '@cio/db/queries/learner/goals';

/**
 * The learner's streak, weekly lesson goal and streak milestones in the organization. A valid `timezone` from the
 * device is saved so days and reminders follow the learner's local time.
 */
export async function getLearnerGoals(orgId: string, profileId: string, timezone?: string) {
  return getLearnerGoalSummary({ organizationId: orgId, profileId, timezone });
}

export async function updateWeeklyLessonTarget(orgId: string, profileId: string, weeklyLessonTarget: number) {
  await upsertLearnerGoal({ organizationId: orgId, profileId, weeklyLessonTarget });

  return getLearnerGoalSummary({ organizationId: orgId, profileId });
}

export async function updateLearnerTimezone(orgId: string, profileId: string, timezone: string) {
  const goal = await upsertLearnerGoal({ organizationId: orgId, profileId, timezone });

  return { timezone: goal.timezone };
}
