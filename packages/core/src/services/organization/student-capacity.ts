import { type DbOrTxClient, db } from '@cio/db/drizzle';
import {
  countActiveStudents,
  getActiveOrganizationPlan,
  lockOrganizationForStudentCapacity
} from '@cio/db/queries/organization';
import { getStudentLimit, isPaymentBlocked } from '@cio/utils/plans';

import { env } from '../../config/env';
import { capturePlanLimitReached } from '../posthog';

export class StudentCapacityError extends Error {
  readonly code = 'UPGRADE_REQUIRED';

  constructor(message: string) {
    super(message);
    this.name = 'StudentCapacityError';
  }
}

export type StudentCapacityCheck = {
  planName: string | null | undefined;
  limit: number;
  currentCount: number;
  newCount: number;
};

/**
 * Locks the org row and throws `StudentCapacityError` when the plan's payment is blocked or `additionalStudents`
 * would go over its student limit. Returns null when there is no limit to check.
 */
export async function checkStudentCapacity(
  orgId: string,
  additionalStudents: number,
  dbClient: DbOrTxClient = db
): Promise<StudentCapacityCheck | null> {
  if (additionalStudents <= 0) return null;
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return null;

  await lockOrganizationForStudentCapacity(orgId, dbClient);

  const activePlan = await getActiveOrganizationPlan(orgId, dbClient);

  if (isPaymentBlocked(activePlan)) {
    throw new StudentCapacityError('This organization is not accepting new students right now');
  }

  const limit = getStudentLimit(activePlan?.planName);

  if (!Number.isFinite(limit)) return null;

  const currentCount = await countActiveStudents(orgId, dbClient);
  const newCount = currentCount + additionalStudents;

  if (newCount > limit) {
    capturePlanLimitReached({
      orgId,
      limitType: 'students',
      plan: activePlan?.planName,
      limit,
      current: currentCount,
      blocked: true
    });

    throw new StudentCapacityError(`This organization has reached its ${limit}-student limit`);
  }

  return { planName: activePlan?.planName, limit, currentCount, newCount };
}
