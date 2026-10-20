import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { db } from '@cio/db/drizzle';
import {
  deletePackageVersionsByIds,
  listVersionsDueForRetention,
  lockAssetRow,
  lockPackageVersionRow,
  markPackageVersionArchived
} from '@cio/db/queries/activity/package-version';
import { deleteScormSessionEventsOlderThan } from '@cio/db/queries/scorm/session-event';
import { getS3Client, getStorageConfig } from '../../config/storage';

export interface ScormRetentionResult {
  eventsDeleted: number;
  versionsDeleted: number;
  versionsArchived: number;
}

function cutoffIso(days: number, nowMs: number): string {
  return new Date(nowMs - days * 86_400_000).toISOString();
}

async function deleteKeys(bucket: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const result = await getS3Client().send(
    new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } })
  );
  if (result.Errors?.length) throw new Error(`Failed to delete SCORM objects: ${result.Errors[0].Code}`);
}

async function deleteContentPrefix(bucket: string, contentPrefix: string): Promise<void> {
  let continuationToken: string | undefined;
  do {
    const page = await getS3Client().send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${contentPrefix}/`, ContinuationToken: continuationToken })
    );
    const keys = (page.Contents ?? []).map((entry) => entry.Key).filter((key): key is string => Boolean(key));
    await deleteKeys(bucket, keys);
    if (page.IsTruncated && !page.NextContinuationToken) throw new Error('Missing SCORM listing continuation token');
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
}

/** Deletes expired events and unused versions; archives versions with only closed attempts, preserving their ZIPs. */
export async function runScormRetention(
  eventOlderThanDays = 90,
  unpinnedVersionDays = 30,
  nowMs: number = Date.now()
): Promise<ScormRetentionResult> {
  const eventsDeleted = await deleteScormSessionEventsOlderThan(cutoffIso(eventOlderThanDays, nowMs));
  const versionCutoff = cutoffIso(unpinnedVersionDays, nowMs);
  const candidates = await listVersionsDueForRetention(versionCutoff);
  let versionsDeleted = 0;
  let versionsArchived = 0;

  for (const candidate of candidates) {
    const outcome = await db.transaction(async (tx) => {
      await lockAssetRow(candidate.assetId, tx);
      await lockPackageVersionRow(candidate.id, tx);
      const [version] = await listVersionsDueForRetention(versionCutoff, tx, candidate.id);
      if (!version || version.hasOpenAttempts) return;

      const bucket = getStorageConfig().bucketScorm;
      await deleteContentPrefix(bucket, version.contentPrefix);
      const keys = [`${version.contentPrefix}.index.json`];
      if (!version.hasAttempts) keys.push(version.uploadKey);
      await deleteKeys(bucket, keys);

      if (version.hasAttempts) {
        await markPackageVersionArchived(version.id, tx);
        return 'archived';
      }

      await deletePackageVersionsByIds([version.id], tx);
      return 'deleted';
    });
    if (outcome === 'deleted') versionsDeleted += 1;
    if (outcome === 'archived') versionsArchived += 1;
  }

  return { eventsDeleted, versionsDeleted, versionsArchived };
}
