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
 * Records a failed subscription payment and queues the admin email.
 * The email key is derived from the first failure, so repeated or retried events never send it twice,
 * and a queue failure is thrown so the delivery is retried.
 * Throws `ORG_PLAN_NOT_FOUND` when no plan has the subscription ID.
 */
export async function markOrgPlanPastDue(subscriptionId: string, payload: TOrganizationPlan['payload']) {
  const plan = await markOrganizationPlanPastDue(subscriptionId, payload);

  if (!plan) {
    throw new AppError('Organization plan not found', ErrorCodes.ORG_PLAN_NOT_FOUND, 404);
  }

  await notifyAdminsOfPaymentFailure(plan);

  return plan;
}
