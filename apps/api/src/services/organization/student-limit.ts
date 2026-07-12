import { AppError, ErrorCodes } from '@api/utils/errors';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getStudentLimit } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';
import {
  countActiveStudents,
  getActiveOrganizationPlan,
  getOrganizationAdminEmails,
  getOrganizationById
} from '@cio/db/queries/organization';

/**
 * Notifies org admins that the org has hit its plan's student limit. Enqueued
 * with a per-day idempotency key so repeated blocked attempts don't spam admins.
 */
async function notifyAdminsStudentLimitReached(
  orgId: string,
  studentCount: number,
  studentLimit: number
): Promise<void> {
  const [admins, org] = await Promise.all([getOrganizationAdminEmails(orgId), getOrganizationById(orgId)]);

  if (!admins.length || !org) return;

  const todayKey = new Date().toISOString().slice(0, 10);
  const upgradeUrl = `${getDashboardBaseUrl()}/org/${org.siteName}?upgrade=true`;

  await enqueueTransactionalEmail('studentLimitReached', {
    to: admins.map((admin) => admin.email),
    fields: {
      orgName: org.name,
      studentCount,
      studentLimit,
      upgradeUrl
    },
    idempotencyKey: `student-limit-reached:${orgId}:${todayKey}`
  });
}

/**
 * Throws `UPGRADE_REQUIRED` when adding `additionalStudents` new org members
 * with the student role would push the org past its plan's student limit.
 * Self-hosted orgs and paid plans with an unlimited allowance are exempt.
 *
 * Fires an admin-notification email (fire-and-forget) the moment the limit is hit.
 */
export async function assertStudentCapacityOrThrow(orgId: string, additionalStudents: number): Promise<void> {
  if (additionalStudents <= 0) return;
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return;

  const activePlan = await getActiveOrganizationPlan(orgId);
  const limit = getStudentLimit(activePlan?.planName);

  if (!Number.isFinite(limit)) return;

  const currentCount = await countActiveStudents(orgId);

  if (currentCount + additionalStudents > limit) {
    notifyAdminsStudentLimitReached(orgId, currentCount, limit).catch((error) => {
      console.error('notifyAdminsStudentLimitReached error:', error);
    });

    throw new AppError(
      `This organization has reached its ${limit}-student limit on the Free plan`,
      ErrorCodes.UPGRADE_REQUIRED,
      403
    );
  }
}
