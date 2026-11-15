import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
import { analyticsKey, analyticsTtlSeconds } from '@cio/core/utils/redis/analytics-cache';
import { getAnalyticsScopeSummary } from '@cio/db/queries/analytics';
import type { TAnalyticsDashboardParam } from '@cio/utils/validation/analytics';

import { ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from './authorize';
import { toAnalyticsError } from './errors';
import { ANALYTICS_PRESETS } from './presets';
import { getAnalyticsCourseStructure } from './structure';
import type { AuthorizedAnalyticsScope, AnalyticsActor, AnalyticsCourseStructure, AnalyticsDashboard } from './types';

async function loadDashboardStructures(
  scope: AuthorizedAnalyticsScope
): Promise<Record<string, AnalyticsCourseStructure>> {
  if (scope.type === 'org') return {};

  const courseIds = scope.courseIds.slice(0, ANALYTICS_LIMITS.maxOutlineCourses);
  const structures = await Promise.all(courseIds.map((courseId) => getAnalyticsCourseStructure(scope.orgId, courseId)));

  return Object.fromEntries(structures.map((structure) => [structure.courseId, structure]));
}

/**
 * Header data, course outlines and preset widgets for one scope. The summary shares the scope's TTL; a refresh
 * recomputes it even when a cached copy exists, so the manual refresh button updates scope counts and courses too.
 */
export async function getAnalyticsDashboardForActor(
  actor: AnalyticsActor,
  param: TAnalyticsDashboardParam,
  options: { refresh?: boolean } = {}
): Promise<AnalyticsDashboard> {
  try {
    const scope = await resolveAuthorizedScope(actor, { type: param.scopeType, id: param.scopeId });
    const ttlSeconds = analyticsTtlSeconds(scope.type);
    const summaryKey = analyticsKey('dashboard', scope.orgId, scope.type, scope.id);
    const summary = await cachedRead(summaryKey, ttlSeconds, () => getAnalyticsScopeSummary(scope), {
      refresh: Boolean(options.refresh)
    });
    const structures = await loadDashboardStructures(scope);
    const widgets = ANALYTICS_PRESETS[scope.type];

    return {
      scope: { ...summary.data, type: scope.type, id: scope.id },
      structures,
      widgets,
      refreshIntervalSeconds: ttlSeconds
    };
  } catch (error) {
    throw toAnalyticsError(error, ErrorCodes.ANALYTICS_DASHBOARD_FAILED);
  }
}
