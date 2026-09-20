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
 * Clamps inline so no window exists where a demoted admin still holds instructor access,
 * then falls back to the queue as a retry if that throws. Never fails the caller.
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
