import { deleteScormSessionEventsOlderThan } from '@cio/db/queries/scorm/session-event';
import { deletePackageVersionsByIds, listStaleUnpinnedPackageVersions } from '@cio/db/queries/activity/package-version';

import { getStorageConfig } from '../../config/storage';
import { deleteS3Prefix } from '../../utils/s3';

export interface ScormRetentionResult {
  eventsDeleted: number;
  versionsDeleted: number;
  objectsDeleted: number;
}

function cutoffIso(days: number, nowMs: number): string {
  return new Date(nowMs - days * 86_400_000).toISOString();
}

/**
 * Deletes diagnostic events past their window and extracted files plus rows
 * of replaced, unreferenced package versions. Original ZIPs are kept.
 */
export async function runScormRetention(
  eventOlderThanDays = 90,
  unpinnedVersionDays = 30,
  nowMs: number = Date.now()
): Promise<ScormRetentionResult> {
  const eventsDeleted = await deleteScormSessionEventsOlderThan(cutoffIso(eventOlderThanDays, nowMs));

  const stale = await listStaleUnpinnedPackageVersions(cutoffIso(unpinnedVersionDays, nowMs));
  const bucket = getStorageConfig().bucketScorm;
  let objectsDeleted = 0;
  const purgedIds: string[] = [];

  for (const version of stale) {
    const removed = await deleteS3Prefix(bucket, `${version.contentPrefix}/`);
    objectsDeleted += removed;
    purgedIds.push(version.id);
  }

  const deletedIds = await deletePackageVersionsByIds(purgedIds);

  return { eventsDeleted, versionsDeleted: deletedIds.length, objectsDeleted };
}
