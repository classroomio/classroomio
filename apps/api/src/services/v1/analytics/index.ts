import { describeAnalyticsRegistry } from '@cio/db/queries/analytics';
import {
  getAnalyticsDashboardSnapshotForActor,
  listAnalyticsStudentsForActor,
  resolveAnalyticsActorForCreator,
  runAnalyticsQueryForActor,
  type AnalyticsDashboardSnapshot,
  type AnalyticsQueryResult,
  type AnalyticsStudentsResult
} from '@api/services/analytics';
import {
  assertAutomationActor,
  assertOrgTeamMember,
  toPublicApiPagination,
  type TPublicApiPagination
} from '@api/services/v1/shared';
import {
  ANALYTICS_DIMENSION_DESCRIPTIONS,
  ANALYTICS_FILTER_DESCRIPTIONS,
  ANALYTICS_METRIC_DESCRIPTIONS,
  ANALYTICS_SOURCE_DESCRIPTIONS,
  ANALYTICS_WIDGET_DESCRIPTIONS
} from '@cio/utils/constants/analytics-catalog';
import type { TAnalyticsDimension, TAnalyticsFilterField, TAnalyticsMetric } from '@cio/utils/constants/analytics';
import type { AnalyticsStudentTableSort } from '@cio/utils/analytics';
import type {
  TPublicApiAnalyticsQueryRequest,
  TPublicApiAnalyticsScope,
  TPublicApiAnalyticsSnapshotQuery,
  TPublicApiAnalyticsStudentSort,
  TPublicApiCourseAnalyticsStudentsQuery,
  TPublicApiAnalyticsStudentsQuery
} from '@cio/utils/validation/public-api';

/**
 * The analytics catalog for external callers: what the compiled registry supports for each source, with the
 * documentation strings from the shared catalog. Widgets are preset ids, not queryable sources.
 */
export async function getPublicApiAnalyticsCatalogService(orgId: string, actorId: string | null) {
  await assertOrgTeamMember(orgId, actorId);

  const registry = describeAnalyticsRegistry();
  const sources = Object.values(registry).map((source) => {
    const dimensions = withCatalogDescriptions(
      source.dimensions,
      (dimensionId) => ANALYTICS_DIMENSION_DESCRIPTIONS[dimensionId as TAnalyticsDimension]
    );
    const metrics = withCatalogDescriptions(
      source.metrics,
      (metricId) => ANALYTICS_METRIC_DESCRIPTIONS[metricId as TAnalyticsMetric]
    );
    const filters = withCatalogDescriptions(
      source.filters,
      (filterField) => ANALYTICS_FILTER_DESCRIPTIONS[filterField as TAnalyticsFilterField]
    );
    const catalogSource = {
      id: source.id,
      description: ANALYTICS_SOURCE_DESCRIPTIONS[source.id],
      scopeTypes: source.scopeTypes,
      hasSearch: source.hasSearch,
      dimensions,
      metrics,
      filters
    };

    return [catalogSource.id, catalogSource];
  });
  const sourcesById = Object.fromEntries(sources);

  return { sources: sourcesById, widgets: ANALYTICS_WIDGET_DESCRIPTIONS };
}

function withCatalogDescriptions<Definition extends Record<string, unknown>>(
  definitions: Record<string, Definition>,
  descriptionOf: (definitionId: string) => string
): Record<string, Definition & { description: string }> {
  const entries = Object.entries(definitions).map(([definitionId, definition]) => {
    const description = descriptionOf(definitionId);

    return [definitionId, { ...definition, description }] as const;
  });

  return Object.fromEntries(entries);
}

/** Runs one analytics query for the key creator, with the same authorization the dashboard enforces. */
export async function queryPublicApiAnalyticsService(
  orgId: string,
  actorId: string | null,
  request: TPublicApiAnalyticsQueryRequest
): Promise<AnalyticsQueryResult> {
  assertAutomationActor(actorId);
  const actor = await resolveAnalyticsActorForCreator(orgId, actorId);

  return runAnalyticsQueryForActor(actor, request);
}

/** One dashboard snapshot for the key creator: authorized once, then every visible widget computed. */
export async function getPublicApiAnalyticsSnapshotService(
  orgId: string,
  actorId: string | null,
  scope: TPublicApiAnalyticsScope,
  query: TPublicApiAnalyticsSnapshotQuery
): Promise<AnalyticsDashboardSnapshot> {
  assertAutomationActor(actorId);
  const actor = await resolveAnalyticsActorForCreator(orgId, actorId);

  return getAnalyticsDashboardSnapshotForActor(actor, scope, query);
}

const TABLE_SORT_BY_PUBLIC_SORT: Record<TPublicApiAnalyticsStudentSort, AnalyticsStudentTableSort> = {
  status: 'status',
  name: 'name',
  progress: 'progress',
  score: 'score',
  lastLogin: 'last_login'
};

/** Lists the students of a scope with their analytics, from the same students table the dashboards show. */
export async function listPublicApiAnalyticsStudentsService(
  orgId: string,
  actorId: string | null,
  scope: TPublicApiAnalyticsScope,
  query: TPublicApiAnalyticsStudentsQuery | TPublicApiCourseAnalyticsStudentsQuery
): Promise<{ items: AnalyticsStudentsResult['rows']; pagination: TPublicApiPagination }> {
  assertAutomationActor(actorId);
  const actor = await resolveAnalyticsActorForCreator(orgId, actorId);
  const tableSort = TABLE_SORT_BY_PUBLIC_SORT[query.sort];
  const studentsQuery = {
    courseId: 'courseId' in query ? query.courseId : undefined,
    search: query.search,
    status: query.status,
    isOverdue: query.isOverdue,
    sort: tableSort,
    dir: query.dir,
    page: query.page,
    limit: query.limit
  };
  const result = await listAnalyticsStudentsForActor(actor, scope, studentsQuery);

  return { items: result.rows, pagination: toPublicApiPagination(result.page, result.limit, result.total) };
}
