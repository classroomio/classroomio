import { PLAN } from './constants';

export type ZapierRateLimits = {
  readPerMinute: number;
  writePerMinute: number;
};

const NO_ZAPIER_ACCESS: ZapierRateLimits = { readPerMinute: 0, writePerMinute: 0 };

const ZAPIER_RATE_LIMITS_BY_PLAN: Record<string, ZapierRateLimits> = {
  [PLAN.BASIC]: NO_ZAPIER_ACCESS,
  [PLAN.EARLY_ADOPTER]: { readPerMinute: 120, writePerMinute: 40 },
  [PLAN.ENTERPRISE]: { readPerMinute: 360, writePerMinute: 120 }
};

/**
 * Per-minute request limits shared by every Zapier connection of one organization on `planName`.
 */
export function getZapierRateLimits(planName: string | null | undefined): ZapierRateLimits {
  if (!planName) return NO_ZAPIER_ACCESS;

  return ZAPIER_RATE_LIMITS_BY_PLAN[planName] ?? NO_ZAPIER_ACCESS;
}
