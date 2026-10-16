import * as schema from '@db/schema';

import { and, eq, inArray } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Deletes every SCORM attempt of a learner for the given activities.
 * Cascades to module tries and session events. Returns the attempt count.
 * Runs inside the caller's reset transaction.
 */
export async function deleteScormAttemptsByLearner(
  activityIds: string[],
  profileId: string,
  tx: DbOrTxClient
): Promise<number> {
  try {
    if (activityIds.length === 0) return 0;

    const deleted = await tx
      .delete(schema.scormAttempt)
      .where(and(inArray(schema.scormAttempt.activityId, activityIds), eq(schema.scormAttempt.profileId, profileId)))
      .returning({ id: schema.scormAttempt.id });

    return deleted.length;
  } catch (error) {
    console.error('deleteScormAttemptsByLearner error:', error);
    throw new Error(
      `Failed to delete SCORM attempts for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countScormAttemptsByLearner(
  activityIds: string[],
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    if (activityIds.length === 0) return 0;

    const rows = await dbClient
      .select({ id: schema.scormAttempt.id })
      .from(schema.scormAttempt)
      .where(and(inArray(schema.scormAttempt.activityId, activityIds), eq(schema.scormAttempt.profileId, profileId)));

    return rows.length;
  } catch (error) {
    console.error('countScormAttemptsByLearner error:', error);
    throw new Error(
      `Failed to count SCORM attempts for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
