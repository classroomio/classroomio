import { syncLearningPathMembersProgress } from '@cio/core/services/learning-path/progress-sync';
import { enqueueLearningPathProgressSync, isRedisConfigured, type TLearningPathProgressSyncPayload } from '@cio/jobs';

/**
 * Schedules a learning-path progress sync after a change has committed. Runs
 * on the maintenance worker when Redis is available, otherwise in this process
 * in the background, so installs without Redis still get completions and
 * certificates. Never throws: the change that triggered it is already saved.
 */
export function scheduleLearningPathProgressSync(payload: TLearningPathProgressSyncPayload): void {
  void (async () => {
    if (isRedisConfigured()) {
      try {
        await enqueueLearningPathProgressSync(payload);

        return;
      } catch (error) {
        console.error('enqueueLearningPathProgressSync failed, syncing in process', payload, error);
      }
    }

    try {
      await syncLearningPathMembersProgress(payload);
    } catch (error) {
      console.error('syncLearningPathMembersProgress failed', payload, error);
    }
  })();
}
