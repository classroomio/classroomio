import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getCrossedStudentMilestone,
  notifyStudentMilestone,
  type StudentMilestoneNotification
} from '@cio/core/services/organization/student-milestone';
import { getStudentLimit } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';
import { type DbOrTxClient, db } from '@cio/db/drizzle';
import {
  countActiveStudents,
  getActiveOrganizationPlan,
  lockOrganizationForStudentCapacity
} from '@cio/db/queries/organization';

export { notifyStudentMilestone };
export type { StudentMilestoneNotification };

/**
 * How many more students the org can take, or `Infinity` when unlimited.
 *
 * The counterpart to `assertStudentCapacityOrThrow` for callers that must
 * partially succeed: an import of 900 learners with 300 seats left should add
 * 300 and report the rest, not reject the file.
 */
export async function getRemainingStudentSeats(orgId: string, dbClient: DbOrTxClient = db): Promise<number> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return Number.POSITIVE_INFINITY;

  const activePlan = await getActiveOrganizationPlan(orgId, dbClient);
  const limit = getStudentLimit(activePlan?.planName);

  if (!Number.isFinite(limit)) return Number.POSITIVE_INFINITY;

  const currentCount = await countActiveStudents(orgId, dbClient);

  return Math.max(0, limit - currentCount);
}

/**
 * Throws `UPGRADE_REQUIRED` when adding `additionalStudents` new student-role
 * members would push the org past its plan's student limit. Self-hosted orgs
 * and plans with an unlimited allowance are exempt.
 *
 * When the addition is allowed and crosses a milestone (50% or the limit), it
 * fires a one-time admin email (fire-and-forget). Blocked attempts do NOT email.
 */
export async function assertStudentCapacityOrThrow(
  orgId: string,
  additionalStudents: number,
  dbClient: DbOrTxClient = db,
  options: { deferNotification?: boolean } = {}
): Promise<StudentMilestoneNotification | null> {
  if (additionalStudents <= 0) return null;
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return null;

  await lockOrganizationForStudentCapacity(orgId, dbClient);

  const activePlan = await getActiveOrganizationPlan(orgId, dbClient);
  const limit = getStudentLimit(activePlan?.planName);

  if (!Number.isFinite(limit)) return null;

  const currentCount = await countActiveStudents(orgId, dbClient);
  const newCount = currentCount + additionalStudents;

  if (newCount > limit) {
    throw new AppError(
      `This organization has reached its ${limit}-student limit on the Free plan`,
      ErrorCodes.UPGRADE_REQUIRED,
      403
    );
  }

  const notification = getCrossedStudentMilestone(orgId, currentCount, newCount, limit);

  if (notification && !options.deferNotification) {
    notifyStudentMilestone(notification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  return notification;
}
