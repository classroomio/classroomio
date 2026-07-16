import { OrgPlanApiServer } from '$features/org/api/org-plan.server';
import { CreditPurchaseApiServer } from '$features/agent/api/credit-purchase.server';
import { PLAN, TOKEN_PACK } from '@cio/utils/plans';
import type {
  PolarOrderWebhookPayload,
  PolarSubscriptionWebhookPayload,
  PolarWebhookPayload,
  SubscriptionData
} from '$lib/utils/types/polar';
import { Webhooks } from '@polar-sh/sveltekit';
import { env } from '$env/dynamic/private';

export const POST = Webhooks({
  webhookSecret: env.POLAR_WEBHOOK_SECRET!,
  onPayload
});

function isSubscriptionPayload(payload: PolarWebhookPayload): payload is PolarSubscriptionWebhookPayload {
  return (
    payload.type === 'checkout.created' ||
    payload.type === 'checkout.updated' ||
    payload.type.startsWith('subscription.')
  );
}

function isOrderPayload(payload: PolarWebhookPayload): payload is PolarOrderWebhookPayload {
  return payload.type === 'order.paid' || payload.type === 'order.created' || payload.type === 'order.refunded';
}

async function onPayload(payload: PolarWebhookPayload) {
  console.log('Polar webhook', payload.type);

  if (isOrderPayload(payload)) {
    if (payload.type !== 'order.paid') {
      return;
    }

    const order = payload.data;
    const md = order.metadata ?? {};

    if (md.kind !== 'token_pack' || !md.orgId) {
      return;
    }

    const quantityFromItems = order.items?.[0]?.quantity;
    const quantityParsed = Number(md.quantity ?? '1');
    const quantity =
      quantityFromItems != null && quantityFromItems > 0
        ? quantityFromItems
        : Number.isFinite(quantityParsed) && quantityParsed > 0
          ? Math.trunc(quantityParsed)
          : 1;
    const tokensPerUnit = Number(md.tokensPerUnit ?? '') || TOKEN_PACK.TOKENS_PER_UNIT;
    const tokens = quantity * tokensPerUnit;
    const totalCents = order.totalAmount ?? order.amount ?? 0;
    const unitPriceCents = quantity > 0 ? Math.round(totalCents / quantity) : totalCents;

    const triggeredByRaw = md.triggeredBy?.trim();
    let triggeredBy: string | undefined;

    if (
      triggeredByRaw &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(triggeredByRaw)
    ) {
      triggeredBy = triggeredByRaw;
    }

    try {
      await CreditPurchaseApiServer.recordPurchase({
        orgId: md.orgId,
        triggeredBy,
        providerOrderId: order.id,
        tokens,
        quantity,
        unitPriceCents,
        currency: order.currency ?? 'USD',
        payload: order as unknown as Record<string, unknown>
      });
    } catch (error) {
      console.error('Error recording credit purchase', error);
    }

    return;
  }

  if (!isSubscriptionPayload(payload)) {
    console.log('Unknown Polar event', payload.type);

    return;
  }

  const data = payload.data as SubscriptionData;
  const metadata = data.metadata;
  const orgId = metadata.orgId;
  const triggeredBy = metadata.triggeredBy;
  const subscriptionId = data.id;
  const isSubscriptionActive = data.status === 'active';

  switch (payload.type) {
    case 'checkout.created':
      break;
    case 'checkout.updated':
      break;
    case 'subscription.created':
      if (metadata.kind === 'token_pack') {
        break;
      }

      if (!orgId || triggeredBy === undefined || triggeredBy === '') {
        console.error('subscription.created missing org metadata');

        break;
      }

      if (isSubscriptionActive) {
        try {
          const planData = {
            orgId,
            triggeredBy: parseInt(triggeredBy, 10),
            planName: PLAN.EARLY_ADOPTER as 'EARLY_ADOPTER' | 'ENTERPRISE' | 'BASIC',
            subscriptionId,
            payload: data as unknown as Record<string, unknown>
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
        try {
          const result = await OrgPlanApiServer.cancelOrgPlan({
            subscriptionId,
            payload: data as unknown as Record<string, unknown>
          });
          console.log('Subscription canceled', result);
        } catch (error) {
          console.error('Error canceling org plan', error);
        }
      } else {
        try {
          const result = await OrgPlanApiServer.updateOrgPlan({
            subscriptionId,
            payload: data as unknown as Record<string, unknown>
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
      try {
        const result = await OrgPlanApiServer.cancelOrgPlan({
          subscriptionId,
          payload: data as unknown as Record<string, unknown>
        });
        console.log('Subscription revoked', result);
      } catch (error) {
        console.error('Error revoking org plan', error);
      }

      break;
    case 'subscription.canceled':
      break;
    default:
      // Exhaustive over `PolarSubscriptionWebhookPayload`; kept for future Polar event types.
      console.log('Unknown subscription-related event');

      break;
  }
}
