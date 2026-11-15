import { env } from '@cio/core/config/env';
import { ANALYTICS_TTL_SECONDS, analyticsPlanKey } from '@cio/core/utils/redis/analytics-cache';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { FREE_PLAN_ANALYTICS_DAYS, ANALYTICS_RANGE_DAYS, type TAnalyticsRange } from '@cio/utils/constants/analytics';
import { isOrgOnFreePlan } from '@cio/utils/plans';
import { cachedRead } from '@api/utils/redis/cached-read';

/**
 * The range a Free plan may read instead of the one it asked for. Presets leave `range` at its default, so clamping
 * keeps them runnable while the history stays inside the plan.
 */
export const FREE_PLAN_ANALYTICS_RANGE: TAnalyticsRange = '7d';

/**
 * The history range a request may actually read. Self-hosted installs and paid plans keep the requested range; the
 * Free plan is clamped to `FREE_PLAN_ANALYTICS_DAYS`. Resolve before hashing a spec, so the clamped range is part of
 * the cache key.
 */
export async function resolveAnalyticsRange(orgId: string, range: TAnalyticsRange): Promise<TAnalyticsRange> {
  const rangeDays = ANALYTICS_RANGE_DAYS[range];
  if (rangeDays !== null && rangeDays <= FREE_PLAN_ANALYTICS_DAYS) return range;

  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
  if (isSelfHosted) return range;

  const entry = await cachedRead(analyticsPlanKey(orgId), ANALYTICS_TTL_SECONDS.plan, () =>
    getActiveOrganizationPlan(orgId)
  );
  const activePlan = entry.data;
  const plans = activePlan ? [{ planName: activePlan.planName, isActive: activePlan.isActive }] : [];
  const isFreePlan = isOrgOnFreePlan({ plans, isSelfHosted, orgId });

  return isFreePlan ? FREE_PLAN_ANALYTICS_RANGE : range;
}
