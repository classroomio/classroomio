import { getComplianceSnapshot } from '@cio/core/services/activity/providers/scorm/results';
import { runActivityCompletionSideEffects } from '@api/services/activity/activity-completion';

const SIDE_EFFECT_CONCURRENCY = 5;

/**
 * Runs certification and compliance for each learner a settings change
 * completed, a few at a time. One learner's failure is logged and never stops
 * the others.
 */
export async function runSettingsCompletionSideEffects(activityId: string, profileIds: string[]): Promise<void> {
  for (let start = 0; start < profileIds.length; start += SIDE_EFFECT_CONCURRENCY) {
    const batch = profileIds.slice(start, start + SIDE_EFFECT_CONCURRENCY);

    await Promise.all(
      batch.map(async (profileId) => {
        try {
          const snapshot = await getComplianceSnapshot(activityId, profileId);
          await runActivityCompletionSideEffects(activityId, profileId, snapshot?.minutes);
        } catch (error) {
          console.error('runSettingsCompletionSideEffects error:', error);
        }
      })
    );
  }
}
