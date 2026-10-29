import { env } from '@cio/core/config/env';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { FREE_PLAN_INSIGHTS_DAYS, INSIGHTS_RANGE_DAYS, type TInsightsRange } from '@cio/utils/constants/insights';
import { isOrgOnFreePlan } from '@cio/utils/plans';

import { AppError, ErrorCodes } from '@api/utils/errors';

/**
 * Rejects a history range the org's plan does not include. Self-hosted installs and paid plans see every range; the
 * Free plan stops at `FREE_PLAN_INSIGHTS_DAYS`. Checked before the cache so a wider range can never be served.
 */
export async function assertInsightsRangeAllowed(orgId: string, range: TInsightsRange): Promise<void> {
  const rangeDays = INSIGHTS_RANGE_DAYS[range];
  if (rangeDays !== null && rangeDays <= FREE_PLAN_INSIGHTS_DAYS) return;

  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
  if (isSelfHosted) return;

  const activePlan = await getActiveOrganizationPlan(orgId);
  const plans = activePlan ? [{ planName: activePlan.planName, isActive: activePlan.isActive }] : [];
  const isFreePlan = isOrgOnFreePlan({ plans, isSelfHosted, orgId });
  if (!isFreePlan) return;

  throw new AppError(
    `Analytics history is limited to ${FREE_PLAN_INSIGHTS_DAYS} days on the Free plan`,
    ErrorCodes.PLAN_UPGRADE_REQUIRED,
    402
  );
}
