import { deleteScormSessionEventsOlderThan } from '@cio/db/queries/scorm/session-event';
import {
  deletePackageVersionsByIds,
  listVersionsDueForRetention,
  markPackageVersionArchived
} from '@cio/db/queries/activity/package-version';

import { getStorageConfig } from '../../config/storage';
import { deleteS3Prefix } from '../../utils/s3';

export interface ScormRetentionResult {
  eventsDeleted: number;
  versionsDeleted: number;
  versionsArchived: number;
  objectsDeleted: number;
}

function cutoffIso(days: number, nowMs: number): string {
  return new Date(nowMs - days * 86_400_000).toISOString();
}

/**
 * Deletes diagnostic events past their window, then applies the three-way
 * rule to replaced package versions: never-launched rows lose files, ZIP
 * and row; launched rows with only closed attempts lose files and are
 * archived; rows with an open attempt are kept.
 */
export async function runScormRetention(
  eventOlderThanDays = 90,
  unpinnedVersionDays = 30,
  nowMs: number = Date.now()
): Promise<ScormRetentionResult> {
  const eventsDeleted = await deleteScormSessionEventsOlderThan(cutoffIso(eventOlderThanDays, nowMs));

  const due = await listVersionsDueForRetention(cutoffIso(unpinnedVersionDays, nowMs));
  const bucket = getStorageConfig().bucketScorm;
  let objectsDeleted = 0;
  let versionsArchived = 0;
  const deleteIds: string[] = [];

  for (const version of due) {
    if (!version.hasAttempts) {
      const removedFiles = await deleteS3Prefix(bucket, `${version.contentPrefix}/`);
      const removedZip = await deleteS3Prefix(bucket, version.uploadKey);
      objectsDeleted += removedFiles + removedZip;
      deleteIds.push(version.id);
    } else if (!version.hasOpenAttempts) {
      const removed = await deleteS3Prefix(bucket, `${version.contentPrefix}/`);
      objectsDeleted += removed;
      await markPackageVersionArchived(version.id);
      versionsArchived += 1;
    }
  }

  const deletedIds = await deletePackageVersionsByIds(deleteIds);
  const versionsDeleted = deletedIds.length;

  console.info('runScormRetention', {
    eventsDeleted,
    versionsDeleted,
    versionsArchived,
    objectsDeleted
  });

  return { eventsDeleted, versionsDeleted, versionsArchived, objectsDeleted };
}
