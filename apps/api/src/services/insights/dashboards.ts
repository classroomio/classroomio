import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import { insightsKey, insightsTtlSeconds } from '@cio/core/utils/redis/insights-cache';
import { getInsightsScopeSummary } from '@cio/db/queries/insights';
import type { TInsightsDashboardParam } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from './authorize';
import { toInsightsError } from './errors';
import { INSIGHTS_PRESETS } from './presets';
import { getInsightsCourseStructure } from './structure';
import type { AuthorizedInsightsScope, InsightsActor, InsightsCourseStructure, InsightsDashboard } from './types';

async function loadDashboardStructures(
  scope: AuthorizedInsightsScope
): Promise<Record<string, InsightsCourseStructure>> {
  if (scope.type === 'org') return {};

  const courseIds = scope.courseIds.slice(0, INSIGHTS_LIMITS.maxOutlineCourses);
  const structures = await Promise.all(courseIds.map((courseId) => getInsightsCourseStructure(scope.orgId, courseId)));

  return Object.fromEntries(structures.map((structure) => [structure.courseId, structure]));
}

/**
 * Header data, course outlines and preset widgets for one scope. The summary shares the scope's TTL.
 */
export async function getInsightsDashboardForActor(
  actor: InsightsActor,
  param: TInsightsDashboardParam
): Promise<InsightsDashboard> {
  try {
    const scope = await resolveAuthorizedScope(actor, { type: param.scopeType, id: param.scopeId });
    const ttlSeconds = insightsTtlSeconds(scope.type);
    const summaryKey = insightsKey('dashboard', scope.orgId, scope.type, scope.id);
    const summary = await cachedRead(summaryKey, ttlSeconds, () => getInsightsScopeSummary(scope));
    const structures = await loadDashboardStructures(scope);
    const widgets = INSIGHTS_PRESETS[scope.type];

    return {
      scope: { ...summary.data, type: scope.type, id: scope.id },
      structures,
      widgets,
      refreshIntervalSeconds: ttlSeconds
    };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_DASHBOARD_FAILED);
  }
}
