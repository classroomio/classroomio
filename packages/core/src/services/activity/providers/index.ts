import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TActivityKind } from '@cio/utils/constants/activity';

import { scormProvider } from './scorm';
import type { ActivityProvider } from './types';

export * from './types';
export { attachScormPackage, detachScormPackage } from './scorm';

export const ACTIVITY_PROVIDERS: Record<TActivityKind, ActivityProvider> = {
  scorm: scormProvider
};

/**
 * Deletes every provider's learner state for these activities, inside the
 * caller's reset transaction. Each provider only touches its own kind.
 */
export async function resetActivityLearnerState(
  activityIds: string[],
  profileId: string,
  tx: DbOrTxClient
): Promise<number> {
  let deletedAttempts = 0;

  for (const provider of Object.values(ACTIVITY_PROVIDERS)) {
    deletedAttempts += await provider.resetLearner(activityIds, profileId, tx);
  }

  return deletedAttempts;
}
