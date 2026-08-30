import { enqueueCourseRoleReconcile, isRedisConfigured } from '@cio/jobs';

import { clampCourseRolesToOrgRole } from '@cio/db/queries/group';
import { getUserOrgRole } from '@cio/db/queries/organization';

/**
 * Re-aligns one person's course roles with the role they currently hold in an organization.
 *
 * A `groupmember` row is durable: it is the author of their newsfeed posts, comments and
 * submissions, so it cannot be deleted when their org role changes. Without this, a former
 * admin re-invited as a tutor or student would keep instructor privileges on every course
 * they had a team role in.
 *
 * The current org role is read here rather than passed in, so the job is safe to retry, to
 * run after a rolled-back transaction, or to run twice concurrently. A person with no
 * membership left is skipped: removal is already handled by the course authorization
 * checks, which require live org membership.
 *
 * @returns how many course roles were demoted
 */
export async function reconcileCourseRolesToOrgRole(organizationId: string, profileId: string): Promise<number> {
  const orgRoleId = await getUserOrgRole(organizationId, profileId);
  if (orgRoleId === null) return 0;

  return clampCourseRolesToOrgRole(organizationId, profileId, orgRoleId);
}

/**
 * Schedules a course-role reconciliation off the request path.
 *
 * This must never fail the invite or join the user just completed, but it also must not be
 * silently dropped the way a best-effort cleanup can be: a course role outranking someone's
 * org role is a privilege-retention risk. So when the queue is unavailable, reconcile inline
 * rather than skip it.
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
