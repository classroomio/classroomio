import { cancelOrgPlan, createOrgPlan, updateOrgPlan } from '$lib/utils/services/org';

import { PLAN } from '@cio/utils/plans';
import type { PolarWebhookPayload } from '$lib/utils/types/polar';
import { Webhooks } from '@polar-sh/sveltekit';
import { env } from '$env/dynamic/private';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';

export const POST = Webhooks({
  webhookSecret: env.POLAR_WEBHOOK_SECRET!,
  onPayload
});

async function onPayload(payload: PolarWebhookPayload) {
  const supabase = getServerSupabase();

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
        const { data, error } = await createOrgPlan({
          supabase,
          subscriptionId,
          orgId,
          triggeredBy: parseInt(triggeredBy),
          planName: PLAN.EARLY_ADOPTER,
          data: payload.data
        });

        if (error) {
          console.error('Error creating org plan', error);
        }
        console.log('Subscription created', data);
      }
      break;
    case 'subscription.updated':
      if (!isSubscriptionActive) {
        // Handle Cancel Subscription
        const { data, error } = await cancelOrgPlan({
          subscriptionId,
          data: payload.data
        });

        if (error) {
          console.error('Error canceling org plan', error);
        }
        console.log('Subscription canceled', data);
      } else {
        // Handle Update Subscription
        const { data, error } = await updateOrgPlan({
          supabase,
          subscriptionId,
          data: payload.data
        });

        if (error) {
          console.error('Error updating org plan', error);
        }
        console.log('Subscription updated', data);
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
