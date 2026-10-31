import { AppError, ErrorCodes } from '@api/utils/errors';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { getPaymentBlockDate } from '@cio/utils/plans';
import {
  getOrganizationAdminEmails,
  getOrganizationById,
  markOrganizationPlanPastDue
} from '@cio/db/queries/organization';
import type { TOrganizationPlan } from '@db/types';

async function notifyAdminsOfPaymentFailure(plan: TOrganizationPlan): Promise<void> {
  const blockDate = getPaymentBlockDate(plan);

  if (!plan.orgId || !blockDate) {
    return;
  }

  const org = await getOrganizationById(plan.orgId);

  if (!org) {
    return;
  }

  const admins = await getOrganizationAdminEmails(plan.orgId);

  if (!admins.length) {
    return;
  }

  const billingUrl = `${getAppBaseUrl()}/org/${org.siteName}/settings/billing`;
  const blockDateLabel = blockDate.toLocaleDateString('en-US', { dateStyle: 'long' });

  await enqueueTransactionalEmail('paymentFailed', {
    to: admins.map((admin) => admin.email),
    fields: { orgName: org.name, blockDate: blockDateLabel, billingUrl },
    idempotencyKey: `payment-failed:${plan.subscriptionId}:${plan.paymentFailedAt}`
  });
}

/**
 * Records a failed subscription payment for the plan and emails the org admins the first time it fails.
 * Throws `ORG_PLAN_NOT_FOUND` when no plan has the subscription ID. Email errors are logged, never thrown.
 */
export async function markOrgPlanPastDue(subscriptionId: string, payload: TOrganizationPlan['payload']) {
  const result = await markOrganizationPlanPastDue(subscriptionId, payload);

  if (!result) {
    throw new AppError('Organization plan not found', ErrorCodes.ORG_PLAN_NOT_FOUND, 404);
  }

  if (result.isNewFailure) {
    await notifyAdminsOfPaymentFailure(result.plan).catch((error) => {
      console.error('notifyAdminsOfPaymentFailure error:', error);
    });
  }

  return result.plan;
}
