import { invalidateAnalyticsDashboard } from '@cio/core/utils/redis/analytics-cache';
import { setOrganizationStudentTarget } from '@cio/db/queries/analytics';
import type { TUpdateAnalyticsSettings } from '@cio/utils/validation/analytics';

import { ErrorCodes } from '@api/utils/errors';
import { toAnalyticsError } from './errors';

/**
 * Saves the org's student target for the growth chart, then drops the cached org summary so the next load shows it.
 */
export async function updateAnalyticsSettings(
  orgId: string,
  input: TUpdateAnalyticsSettings
): Promise<{ studentTarget: number | null }> {
  try {
    const studentTarget = await setOrganizationStudentTarget(orgId, input.studentTarget);
    await invalidateAnalyticsDashboard(orgId, 'org', orgId);

    return { studentTarget };
  } catch (error) {
    throw toAnalyticsError(error, ErrorCodes.ANALYTICS_QUERY_FAILED);
  }
}
