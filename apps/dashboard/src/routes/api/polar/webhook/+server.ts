import { OrgPlanApiServer } from '$features/org/api/org-plan.server';
import { CreditPurchaseApiServer } from '$features/agent/api/credit-purchase.server';
import { PLAN, TOKEN_PACK } from '@cio/utils/plans';
import type { TCreateOrgPlan } from '@cio/utils/validation/organization';
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

function getOrgPlanData(data: SubscriptionData): TCreateOrgPlan | null {
  const metadata = data.metadata;
  const triggeredByRaw = metadata?.triggeredBy?.trim();
  const triggeredBy = triggeredByRaw ? Number.parseInt(triggeredByRaw, 10) : Number.NaN;

  if (
    metadata?.kind === 'token_pack' ||
    !metadata?.orgId ||
    !triggeredByRaw ||
    !Number.isInteger(triggeredBy) ||
    triggeredBy <= 0
  ) {
    if (metadata?.kind !== 'token_pack') {
      console.error('subscription event missing org metadata');
    }

    return null;
  }

  return {
    orgId: metadata.orgId,
    triggeredBy,
    planName: PLAN.EARLY_ADOPTER as TCreateOrgPlan['planName'],
    subscriptionId: data.id,
    payload: data as unknown as Record<string, unknown>
  };
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
  const subscriptionId = data.id;
  const isSubscriptionActive = data.status === 'active';

  switch (payload.type) {
    case 'checkout.created':
      break;
    case 'checkout.updated':
      break;
    case 'subscription.created':
      if (isSubscriptionActive) {
        const planData = getOrgPlanData(data);

        if (!planData) {
          break;
        }

        try {
          const result = await OrgPlanApiServer.createOrgPlan(planData);
          console.log('Subscription created', result);
        } catch (error) {
          console.error('Error creating org plan', error);
        }
      }

      break;
    case 'subscription.updated':
      if (isSubscriptionActive) {
        const planData = getOrgPlanData(data);

        if (!planData) {
          break;
        }

        try {
          const result = await OrgPlanApiServer.activateOrgPlan(planData);

          if (!result) {
            throw new Error('Organization plan activation request failed');
          }

          console.log('Subscription activated', result);
        } catch (error) {
          console.error('Error activating org plan', error);
          throw error;
        }
      } else {
        try {
          const result = await OrgPlanApiServer.updateOrgPlan({
            subscriptionId,
            payload: data as unknown as Record<string, unknown>
          });
          console.log('Subscription state recorded', result);
        } catch (error) {
          console.error('Error recording subscription state', error);
        }
      }

      break;
    case 'subscription.active':
    case 'subscription.uncanceled': {
      const planData = getOrgPlanData(data);

      if (!planData) {
        break;
      }

      try {
        const result = await OrgPlanApiServer.activateOrgPlan(planData);

        if (!result) {
          throw new Error('Organization plan activation request failed');
        }

        console.log('Subscription activated', result);
      } catch (error) {
        console.error('Error activating org plan', error);
        throw error;
      }

      break;
    }
    case 'subscription.past_due':
    case 'subscription.canceled':
      try {
        const result = await OrgPlanApiServer.updateOrgPlan({
          subscriptionId,
          payload: data as unknown as Record<string, unknown>
        });
        console.log('Subscription state recorded', result);
      } catch (error) {
        console.error('Error recording subscription state', error);
      }

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
    default:
      // Exhaustive over `PolarSubscriptionWebhookPayload`; kept for future Polar event types.
      console.log('Unknown subscription-related event');

      break;
  }
}
