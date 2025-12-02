import { OrgPlanApiServer } from '$lib/features/org/api/org-plan.server';
import { PLAN } from '@cio/utils/plans';
import type { PolarWebhookPayload } from '$lib/utils/types/polar';
import { Webhooks } from '@polar-sh/sveltekit';
import { env } from '$env/dynamic/private';

export const POST = Webhooks({
  webhookSecret: env.POLAR_WEBHOOK_SECRET!,
  onPayload
});

async function onPayload(payload: PolarWebhookPayload) {
  const metadata = payload.data.metadata;
  const orgId = metadata.orgId;
  const triggeredBy = metadata.triggeredBy;
  const subscriptionId = payload.data.id;
  const isSubscriptionActive = payload.data.status === 'active';

  console.log({
    orgId,
    triggeredBy,
    isSubscriptionActive,
    subscriptionId
  });

  if (!orgId) {
    console.error('Org ID is required');
    throw new Error('Org ID is required');
  }

  switch (payload.type) {
    case 'checkout.created':
      break;
    case 'checkout.updated':
      break;
    case 'subscription.created':
      if (isSubscriptionActive) {
        try {
          const planData = {
          orgId,
          triggeredBy: parseInt(triggeredBy),
            planName: PLAN.EARLY_ADOPTER as 'EARLY_ADOPTER' | 'ENTERPRISE' | 'BASIC',
            subscriptionId,
            payload: payload.data as unknown as Record<string, unknown>
          };

          const result = await OrgPlanApiServer.createOrgPlan(planData);
          console.log('Subscription created', result);
        } catch (error) {
          console.error('Error creating org plan', error);
        }
      }
      break;
    case 'subscription.updated':
      if (!isSubscriptionActive) {
        // Handle Cancel Subscription
        try {
          const result = await OrgPlanApiServer.cancelOrgPlan({
          subscriptionId,
            payload: payload.data as unknown as Record<string, unknown>
        });
          console.log('Subscription canceled', result);
        } catch (error) {
          console.error('Error canceling org plan', error);
        }
      } else {
        // Handle Update Subscription
        try {
          const result = await OrgPlanApiServer.updateOrgPlan({
          subscriptionId,
            payload: payload.data as unknown as Record<string, unknown>
        });
          console.log('Subscription updated', result);
        } catch (error) {
          console.error('Error updating org plan', error);
        }
      }
      break;
    case 'subscription.active':
      break;
    case 'subscription.revoked':
      break;
    case 'subscription.canceled':
      break;
    default:
      console.log('Unknown event', payload.type);
      break;
  }
}
