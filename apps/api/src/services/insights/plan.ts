import { env } from '@cio/core/config/env';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { FREE_PLAN_INSIGHTS_DAYS, INSIGHTS_RANGE_DAYS, type TInsightsRange } from '@cio/utils/constants/insights';
import { isOrgOnFreePlan } from '@cio/utils/plans';

/**
 * The range a Free plan may read instead of the one it asked for. Presets leave `range` at its default, so clamping
 * keeps them runnable while the history stays inside the plan.
 */
export const FREE_PLAN_INSIGHTS_RANGE: TInsightsRange = '7d';

/**
 * The history range a request may actually read. Self-hosted installs and paid plans keep the requested range; the
 * Free plan is clamped to `FREE_PLAN_INSIGHTS_DAYS`. Resolve before hashing a spec, so the clamped range is part of
 * the cache key.
 */
export async function resolveInsightsRange(orgId: string, range: TInsightsRange): Promise<TInsightsRange> {
  const rangeDays = INSIGHTS_RANGE_DAYS[range];
  if (rangeDays !== null && rangeDays <= FREE_PLAN_INSIGHTS_DAYS) return range;

  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
  if (isSelfHosted) return range;

  const activePlan = await getActiveOrganizationPlan(orgId);
  const plans = activePlan ? [{ planName: activePlan.planName, isActive: activePlan.isActive }] : [];
  const isFreePlan = isOrgOnFreePlan({ plans, isSelfHosted, orgId });

  return isFreePlan ? FREE_PLAN_INSIGHTS_RANGE : range;
}
