import {
  ZActivityPackageStorageCleanupPayload,
  enqueueActivityPackageStorageCleanup,
  type TActivityPackageStorageCleanupPayload
} from '@cio/jobs';

import { deletePackageStoragePrefix, scormBucket } from '../../utils/storage';
import { errorMessage } from '../../utils/cancel';
import { log } from '../../utils/logger';

/**
 * Removes a canceled or failed version's extracted files. When the inline
 * delete fails, hands the work to a retried cleanup job so the failure is
 * retried and, if it keeps failing, recorded as a dead letter.
 */
export async function cleanupPackageVersionStorage(input: TActivityPackageStorageCleanupPayload): Promise<void> {
  try {
    await deletePackageStoragePrefix(scormBucket(), input.contentPrefix);
    return;
  } catch (error) {
    log.warn('activity-package-storage-cleanup-deferred', {
      packageVersionId: input.packageVersionId,
      error: errorMessage(error)
    });
  }

  try {
    await enqueueActivityPackageStorageCleanup(input);
  } catch (error) {
    log.error('activity-package-storage-cleanup-unscheduled', {
      packageVersionId: input.packageVersionId,
      contentPrefix: input.contentPrefix,
      error: errorMessage(error)
    });
  }
}

/**
 * Runs one retried cleanup job. Throws on any delete failure so the queue
 * retries it with backoff.
 */
export async function processPackageStorageCleanup(data: unknown): Promise<{ packageVersionId: string }> {
  const payload = ZActivityPackageStorageCleanupPayload.parse(data);

  await deletePackageStoragePrefix(scormBucket(), payload.contentPrefix);
  log.info('activity-package-storage-cleanup-done', { packageVersionId: payload.packageVersionId });

  return { packageVersionId: payload.packageVersionId };
}
