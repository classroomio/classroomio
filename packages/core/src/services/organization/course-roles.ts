import { enqueueCourseRoleReconcile, isRedisConfigured } from '@cio/jobs';

import { clampCourseRolesToOrgRole } from '@cio/db/queries/group';
import { getUserOrgRole } from '@cio/db/queries/organization';

/**
 * Demotes a person's course roles to their current org role. Reads the role here rather
 * than taking it as input, so the job stays safe to retry.
 *
 * @returns how many course roles were demoted
 */
export async function reconcileCourseRolesToOrgRole(organizationId: string, profileId: string): Promise<number> {
  const orgRoleId = await getUserOrgRole(organizationId, profileId);
  if (orgRoleId === null) return 0;

  return clampCourseRolesToOrgRole(organizationId, profileId, orgRoleId);
}

/**
 * Queues a reconciliation without failing the caller. Falls back to running it inline
 * rather than skipping, since dropping it would leave privileges behind.
 */
export async function scheduleCourseRoleReconcile(organizationId: string, profileId: string): Promise<void> {
  if (isRedisConfigured()) {
    try {
      await enqueueCourseRoleReconcile({ organizationId, profileId });

      return;
    } catch (error) {
      console.error('scheduleCourseRoleReconcile: enqueue failed, reconciling inline', {
        organizationId,
        profileId,
        error
      });
    }
  }

  try {
    await reconcileCourseRolesToOrgRole(organizationId, profileId);
  } catch (error) {
    console.error('scheduleCourseRoleReconcile: inline reconcile failed', { organizationId, profileId, error });
  }
}
