import { claimInsightsRefresh, insightsKey, insightsTtlSeconds } from '@cio/core/utils/redis/insights-cache';
import {
  requiresOrderedItems,
  runInsightsQuery,
  type InsightsOrderedItem,
  type InsightsQueryOutput
} from '@cio/db/queries/insights';
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsExportRequest, TInsightsQueryRequest, TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from './authorize';
import { canonicalizeSpec, hashSpec } from './canonicalize';
import { toInsightsError } from './errors';
import { assertInsightsRangeAllowed } from './plan';
import { getInsightsCourseStructure, toOrderedItems } from './structure';
import type { AuthorizedInsightsScope, InsightsActor, InsightsQueryResult } from './types';

function courseRequestedIds(spec: TInsightsQuerySpec): string[] | null {
  const courseFilters = spec.filters.filter((filter) => filter.field === 'course' && filter.value !== undefined);
  if (courseFilters.length === 0) return null;

  const requestedIds = courseFilters.map((filter) =>
    Array.isArray(filter.value) ? filter.value : [String(filter.value)]
  );
  const [firstRequest, ...remainingRequests] = requestedIds;

  return remainingRequests.reduce(
    (intersection, ids) => intersection.filter((courseId) => ids.includes(courseId)),
    firstRequest
  );
}

function courseIdsForSpec(scope: AuthorizedInsightsScope, spec: TInsightsQuerySpec): string[] {
  const requested = courseRequestedIds(spec);
  if (!requested) return scope.courseIds;

  const requestedSet = new Set(requested);

  return scope.courseIds.filter((courseId) => requestedSet.has(courseId));
}

export async function loadOrderedItems(
  scope: AuthorizedInsightsScope,
  spec: TInsightsQuerySpec
): Promise<InsightsOrderedItem[]> {
  if (!requiresOrderedItems(spec)) return [];

  const courseIds = courseIdsForSpec(scope, spec);
  if (courseIds.length > INSIGHTS_LIMITS.maxOutlineCourses) {
    throw new AppError(
      'Pick a course to break results down by exercise, section or lesson',
      ErrorCodes.INSIGHTS_QUERY_INVALID,
      400
    );
  }

  const structures = await Promise.all(courseIds.map((courseId) => getInsightsCourseStructure(scope.orgId, courseId)));

  return structures.flatMap(toOrderedItems);
}

export async function computeInsightsQuery(
  scope: AuthorizedInsightsScope,
  spec: TInsightsQuerySpec
): Promise<InsightsQueryOutput> {
  const orderedItems = await loadOrderedItems(scope, spec);

  return runInsightsQuery(spec, { scope, orderedItems });
}

function uncachedResult(output: InsightsQueryOutput): InsightsQueryResult {
  const generatedAt = new Date().toISOString();

  return { ...output, generatedAt, cached: false, refreshThrottled: false };
}

/**
 * Runs one widget spec for the actor. Authorizes before touching the cache, serves cached results inside the scope
 * TTL, recomputes on an allowed refresh, and never caches free-text search.
 */
export async function runInsightsQueryForActor(
  actor: InsightsActor,
  request: TInsightsQueryRequest
): Promise<InsightsQueryResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const spec = canonicalizeSpec(request.spec);
    await assertInsightsRangeAllowed(scope.orgId, spec.range);

    if (spec.search) {
      const output = await computeInsightsQuery(scope, spec);
      return uncachedResult(output);
    }

    const startedAt = Date.now();
    const specHash = hashSpec(spec);
    const key = insightsKey('query', scope.orgId, scope.type, scope.id, specHash);
    const ttlSeconds = insightsTtlSeconds(scope.type);
    const refresh = request.refresh
      ? await claimInsightsRefresh(actor.profileId, scope.type, scope.id, specHash)
      : false;
    const entry = await cachedRead(key, ttlSeconds, () => computeInsightsQuery(scope, spec), { refresh });
    const cached = Date.parse(entry.generatedAt) < startedAt;
    const refreshThrottled = Boolean(request.refresh) && !refresh;

    return { ...entry.data, generatedAt: entry.generatedAt, cached, refreshThrottled };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}

/**
 * Same authorization and spec as a widget, read fresh and without the page-size cap.
 */
export async function exportInsightsQueryForActor(
  actor: InsightsActor,
  request: TInsightsExportRequest
): Promise<InsightsQueryResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const spec = canonicalizeSpec(request.spec);
    await assertInsightsRangeAllowed(scope.orgId, spec.range);
    const output = await computeInsightsQuery(scope, spec);

    return uncachedResult(output);
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_EXPORT_FAILED);
  }
}
