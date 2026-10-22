import { updateActivitySettings } from '@cio/core/services/activity/activity';
import { deliverActivityCompletionSideEffects } from '@api/services/activity/activity-completion';

const SIDE_EFFECT_CONCURRENCY = 5;

/**
 * Delivers the completion side effects the settings transaction enqueued, a
 * few learners at a time. Anything that fails stays in the outbox for the
 * sweeper.
 */
export async function runSettingsCompletionSideEffects(activityId: string, profileIds: string[]): Promise<void> {
  for (let start = 0; start < profileIds.length; start += SIDE_EFFECT_CONCURRENCY) {
    const batch = profileIds.slice(start, start + SIDE_EFFECT_CONCURRENCY);

    await Promise.all(batch.map((profileId) => deliverActivityCompletionSideEffects(activityId, profileId)));
  }
}

/**
 * Saves an activity's settings. Learners the new settings completed get
 * certificate and compliance updates.
 */
export async function saveActivitySettings(courseId: string, activityId: string, input: unknown): Promise<void> {
  const { newlyCompletedProfileIds } = await updateActivitySettings(courseId, activityId, input);

  if (newlyCompletedProfileIds.length === 0) return;

  await runSettingsCompletionSideEffects(activityId, newlyCompletedProfileIds);
}
