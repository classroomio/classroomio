import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TAssetStorageCleanupPayload, TCourseRoleReconcilePayload } from '../payloads/maintenance';

/**
 * Enqueue a background sweep of a deleted asset's object-storage files. The
 * payload carries the concrete buckets/keys/prefixes because the asset row is
 * already deleted by the time this runs.
 */
export async function enqueueAssetStorageCleanup(payload: TAssetStorageCleanupPayload): Promise<string> {
  const job = await getQueue(QUEUE_NAMES.maintenance).add(
    JOB_NAMES.maintenance.assetStorageCleanup,
    payload,
    QUEUE_DEFAULTS[QUEUE_NAMES.maintenance]
  );

  return job.id ?? '';
}

/**
 * Enqueue a reconciliation of one person's course roles against their current org role.
 * Off the request path because it can touch many `groupmember` rows, and it is idempotent,
 * so a retry or a duplicate enqueue costs nothing.
 */
export async function enqueueCourseRoleReconcile(payload: TCourseRoleReconcilePayload): Promise<string> {
  const job = await getQueue(QUEUE_NAMES.maintenance).add(
    JOB_NAMES.maintenance.courseRoleReconcile,
    payload,
    QUEUE_DEFAULTS[QUEUE_NAMES.maintenance]
  );

  return job.id ?? '';
}
