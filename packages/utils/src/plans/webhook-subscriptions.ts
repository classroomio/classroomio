import { PLAN } from './constants';

const WEBHOOK_SUBSCRIPTION_LIMITS_BY_PLAN: Record<string, number> = {
  [PLAN.BASIC]: 0,
  [PLAN.EARLY_ADOPTER]: 50,
  [PLAN.ENTERPRISE]: 250
};

/**
 * Most webhook subscriptions that connected apps may hold for one organization on `planName`.
 */
export function getWebhookSubscriptionLimit(planName: string | null | undefined): number {
  if (!planName) return 0;

  return WEBHOOK_SUBSCRIPTION_LIMITS_BY_PLAN[planName] ?? 0;
}
