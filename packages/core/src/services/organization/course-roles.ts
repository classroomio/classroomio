import { enqueueCourseRoleReconcile, isRedisConfigured } from '@cio/jobs';

import { syncCourseRolesToOrgRole } from '@cio/db/queries/group';
import { getUserOrgRole } from '@cio/db/queries/organization';

/**
 * Syncs a person's course roles to their current org role. Reads the role here rather
 * than taking it as input, so the job stays safe to retry.
 *
 * @returns how many course roles were updated
 */
export async function reconcileCourseRolesToOrgRole(organizationId: string, profileId: string): Promise<number> {
  const orgRoleId = await getUserOrgRole(organizationId, profileId);
  if (orgRoleId === null) return 0;

  return syncCourseRolesToOrgRole(organizationId, profileId, orgRoleId);
}

/**
 * Syncs inline so no window exists where a changed org role hasn't reached the person's
 * courses yet, then falls back to the queue as a retry if that throws. Never fails the caller.
 */
export async function scheduleCourseRoleReconcile(organizationId: string, profileId: string): Promise<void> {
  try {
    await reconcileCourseRolesToOrgRole(organizationId, profileId);

    return;
  } catch (error) {
    console.error('scheduleCourseRoleReconcile: inline reconcile failed, queueing a retry', {
      organizationId,
      profileId,
      error
    });
  }

  if (!isRedisConfigured()) {
    console.error('scheduleCourseRoleReconcile: reconcile failed and no queue is available', {
      organizationId,
      profileId
    });

    return;
  }

  try {
    await enqueueCourseRoleReconcile({ organizationId, profileId });
  } catch (error) {
    console.error('scheduleCourseRoleReconcile: retry could not be queued', { organizationId, profileId, error });
  }
}
