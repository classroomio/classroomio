import { describeInsightsRegistry } from '@cio/db/queries/insights';
import {
  getInsightsDashboardSnapshotForActor,
  listInsightsStudentsForActor,
  resolveInsightsActorForCreator,
  runInsightsQueryForActor,
  type InsightsDashboardSnapshot,
  type InsightsQueryResult,
  type InsightsStudentsResult
} from '@api/services/insights';
import {
  assertAutomationActor,
  assertOrgTeamMember,
  toPublicApiPagination,
  type TPublicApiPagination
} from '@api/services/v1/shared';
import {
  INSIGHTS_DIMENSION_DESCRIPTIONS,
  INSIGHTS_FILTER_DESCRIPTIONS,
  INSIGHTS_METRIC_DESCRIPTIONS,
  INSIGHTS_SOURCE_DESCRIPTIONS,
  INSIGHTS_WIDGET_DESCRIPTIONS
} from '@cio/utils/constants/insights-catalog';
import type { TInsightsDimension, TInsightsFilterField, TInsightsMetric } from '@cio/utils/constants/insights';
import type { InsightsStudentTableSort } from '@cio/utils/insights';
import type {
  TPublicApiInsightsDashboardParam,
  TPublicApiInsightsQueryRequest,
  TPublicApiInsightsSnapshotQuery,
  TPublicApiInsightsStudentSort,
  TPublicApiInsightsStudentsQuery
} from '@cio/utils/validation/public-api';

/**
 * The insights catalog for external callers: what the compiled registry supports for each source, with the
 * documentation strings from the shared catalog. Widgets are preset ids, not queryable sources.
 */
export async function getPublicApiInsightsCatalogService(orgId: string, actorId: string | null) {
  await assertOrgTeamMember(orgId, actorId);

  const registry = describeInsightsRegistry();
  const sources = Object.values(registry).map((source) => {
    const dimensions = withCatalogDescriptions(
      source.dimensions,
      (dimensionId) => INSIGHTS_DIMENSION_DESCRIPTIONS[dimensionId as TInsightsDimension]
    );
    const metrics = withCatalogDescriptions(
      source.metrics,
      (metricId) => INSIGHTS_METRIC_DESCRIPTIONS[metricId as TInsightsMetric]
    );
    const filters = withCatalogDescriptions(
      source.filters,
      (filterField) => INSIGHTS_FILTER_DESCRIPTIONS[filterField as TInsightsFilterField]
    );
    const catalogSource = {
      id: source.id,
      description: INSIGHTS_SOURCE_DESCRIPTIONS[source.id],
      scopeTypes: source.scopeTypes,
      hasSearch: source.hasSearch,
      dimensions,
      metrics,
      filters
    };

    return [catalogSource.id, catalogSource];
  });
  const sourcesById = Object.fromEntries(sources);

  return { sources: sourcesById, widgets: INSIGHTS_WIDGET_DESCRIPTIONS };
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

/** Runs one insights query for the key creator, with the same authorization the dashboard enforces. */
export async function queryPublicApiInsightsService(
  orgId: string,
  actorId: string | null,
  request: TPublicApiInsightsQueryRequest
): Promise<InsightsQueryResult> {
  assertAutomationActor(actorId);
  const actor = await resolveInsightsActorForCreator(orgId, actorId);

  return runInsightsQueryForActor(actor, request);
}

/** One dashboard snapshot for the key creator: authorized once, then every visible widget computed. */
export async function getPublicApiInsightsSnapshotService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiInsightsDashboardParam,
  query: TPublicApiInsightsSnapshotQuery
): Promise<InsightsDashboardSnapshot> {
  assertAutomationActor(actorId);
  const actor = await resolveInsightsActorForCreator(orgId, actorId);
  const scope = { type: params.scopeType, id: params.scopeId };

  return getInsightsDashboardSnapshotForActor(actor, scope, query);
}

const TABLE_SORT_BY_PUBLIC_SORT: Record<TPublicApiInsightsStudentSort, InsightsStudentTableSort> = {
  status: 'status',
  name: 'name',
  progress: 'progress',
  score: 'score',
  lastLogin: 'last_login'
};

/** Lists the students of a scope with their insights, from the same students table the dashboards show. */
export async function listPublicApiInsightsStudentsService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiInsightsStudentsQuery
): Promise<{ items: InsightsStudentsResult['rows']; pagination: TPublicApiPagination }> {
  assertAutomationActor(actorId);
  const actor = await resolveInsightsActorForCreator(orgId, actorId);
  const scope = { type: query.scopeType, id: query.scopeId };
  const tableSort = TABLE_SORT_BY_PUBLIC_SORT[query.sort];
  const studentsQuery = {
    courseId: query.courseId,
    search: query.search,
    status: query.status,
    isOverdue: query.isOverdue,
    sort: tableSort,
    dir: query.dir,
    page: query.page,
    limit: query.limit
  };
  const result = await listInsightsStudentsForActor(actor, scope, studentsQuery);

  return { items: result.rows, pagination: toPublicApiPagination(result.page, result.limit, result.total) };
}
