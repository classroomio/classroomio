import { invalidateInsightsDashboard } from '@cio/core/utils/redis/insights-cache';
import { setOrganizationLearnerTarget } from '@cio/db/queries/insights';
import type { TUpdateInsightsSettings } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { toInsightsError } from './errors';

/**
 * Saves the org's learner target for the growth chart, then drops the cached org summary so the next load shows it.
 */
export async function updateInsightsSettings(
  orgId: string,
  input: TUpdateInsightsSettings
): Promise<{ learnerTarget: number | null }> {
  try {
    const learnerTarget = await setOrganizationLearnerTarget(orgId, input.learnerTarget);
    await invalidateInsightsDashboard(orgId, 'org', orgId);

    return { learnerTarget };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}
