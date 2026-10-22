import { markPackageVersionContentRemoved } from '@cio/db/queries';

import { deletePackageStoragePrefix, scormBucket } from '../../utils/storage';
import { errorMessage } from '../../utils/cancel';
import { log } from '../../utils/logger';

/**
 * Removes a canceled or failed version's extracted files and records that
 * they are gone. Never throws: when any delete fails the version keeps its
 * stored-content marker, and the SCORM retention sweep finishes the cleanup.
 */
export async function cleanupPackageVersionStorage(version: { id: string; contentPrefix: string }): Promise<void> {
  try {
    await deletePackageStoragePrefix(scormBucket(), version.contentPrefix);
    await markPackageVersionContentRemoved(version.id);
  } catch (error) {
    log.warn('activity-package-storage-cleanup-deferred', {
      packageVersionId: version.id,
      error: errorMessage(error)
    });
  }
}
