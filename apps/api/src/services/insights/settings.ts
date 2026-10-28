import { invalidateInsightsDashboard } from '@cio/core/utils/redis/insights-cache';
import { setOrganizationStudentTarget } from '@cio/db/queries/insights';
import type { TUpdateInsightsSettings } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { toInsightsError } from './errors';

/**
 * Saves the org's student target for the growth chart, then drops the cached org summary so the next load shows it.
 */
export async function updateInsightsSettings(
  orgId: string,
  input: TUpdateInsightsSettings
): Promise<{ studentTarget: number | null }> {
  try {
    const studentTarget = await setOrganizationStudentTarget(orgId, input.studentTarget);
    await invalidateInsightsDashboard(orgId, 'org', orgId);

    return { studentTarget };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}
