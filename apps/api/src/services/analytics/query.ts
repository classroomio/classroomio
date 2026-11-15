import { claimAnalyticsRefresh, analyticsKey, analyticsTtlSeconds } from '@cio/core/utils/redis/analytics-cache';
import {
  requiresOrderedItems,
  runAnalyticsQuery,
  type AnalyticsOrderedItem,
  type AnalyticsQueryOutput
} from '@cio/db/queries/analytics';
import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
import type {
  TAnalyticsExportRequest,
  TAnalyticsQueryRequest,
  TAnalyticsQuerySpec
} from '@cio/utils/validation/analytics';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from './authorize';
import { canonicalizeSpec, hashSpec } from './canonicalize';
import { toAnalyticsError } from './errors';
import { resolveAnalyticsRange } from './plan';
import { getAnalyticsCourseStructure, toOrderedItems } from './structure';
import type { AuthorizedAnalyticsScope, AnalyticsActor, AnalyticsQueryResult } from './types';

function courseRequestedIds(spec: TAnalyticsQuerySpec): string[] | null {
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

function courseIdsForSpec(scope: AuthorizedAnalyticsScope, spec: TAnalyticsQuerySpec): string[] {
  const requested = courseRequestedIds(spec);
  if (!requested) return scope.courseIds;

  const requestedSet = new Set(requested);

  return scope.courseIds.filter((courseId) => requestedSet.has(courseId));
}

export async function loadOrderedItems(
  scope: AuthorizedAnalyticsScope,
  spec: TAnalyticsQuerySpec
): Promise<AnalyticsOrderedItem[]> {
  if (!requiresOrderedItems(spec)) return [];

  const courseIds = courseIdsForSpec(scope, spec);
  if (courseIds.length > ANALYTICS_LIMITS.maxOutlineCourses) {
    throw new AppError(
      'Pick a course to break results down by exercise, section or lesson',
      ErrorCodes.ANALYTICS_QUERY_INVALID,
      400
    );
  }

  const structures = await Promise.all(courseIds.map((courseId) => getAnalyticsCourseStructure(scope.orgId, courseId)));

  return structures.flatMap(toOrderedItems);
}

export async function computeAnalyticsQuery(
  scope: AuthorizedAnalyticsScope,
  spec: TAnalyticsQuerySpec
): Promise<AnalyticsQueryOutput> {
  const orderedItems = await loadOrderedItems(scope, spec);

  return runAnalyticsQuery(spec, { scope, orderedItems });
}

function uncachedResult(output: AnalyticsQueryOutput): AnalyticsQueryResult {
  const generatedAt = new Date().toISOString();

  return { ...output, generatedAt, cached: false, refreshThrottled: false };
}

/**
 * Runs one widget spec for the actor. Authorizes before touching the cache, serves cached results inside the scope
 * TTL, recomputes on an allowed refresh, and never caches free-text search.
 */
export async function runAnalyticsQueryForActor(
  actor: AnalyticsActor,
  request: TAnalyticsQueryRequest
): Promise<AnalyticsQueryResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const range = await resolveAnalyticsRange(scope.orgId, request.spec.range);
    const spec = canonicalizeSpec({ ...request.spec, range });

    if (spec.search) {
      const output = await computeAnalyticsQuery(scope, spec);
      return uncachedResult(output);
    }

    const startedAt = Date.now();
    const specHash = hashSpec(spec);
    const key = analyticsKey('query', scope.orgId, scope.type, scope.id, specHash);
    const ttlSeconds = analyticsTtlSeconds(scope.type);
    const refresh = request.refresh
      ? await claimAnalyticsRefresh(actor.profileId, scope.type, scope.id, specHash)
      : false;
    const entry = await cachedRead(key, ttlSeconds, () => computeAnalyticsQuery(scope, spec), { refresh });
    const cached = Date.parse(entry.generatedAt) < startedAt;
    const refreshThrottled = Boolean(request.refresh) && !refresh;

    return { ...entry.data, generatedAt: entry.generatedAt, cached, refreshThrottled };
  } catch (error) {
    throw toAnalyticsError(error, ErrorCodes.ANALYTICS_QUERY_FAILED);
  }
}

/**
 * Same authorization and spec as a widget, read fresh and without the page-size cap.
 */
export async function exportAnalyticsQueryForActor(
  actor: AnalyticsActor,
  request: TAnalyticsExportRequest
): Promise<AnalyticsQueryResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const range = await resolveAnalyticsRange(scope.orgId, request.spec.range);
    const spec = canonicalizeSpec({ ...request.spec, range });
    const output = await computeAnalyticsQuery(scope, spec);

    return uncachedResult(output);
  } catch (error) {
    throw toAnalyticsError(error, ErrorCodes.ANALYTICS_EXPORT_FAILED);
  }
}
