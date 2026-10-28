import { sql, type SQL } from 'drizzle-orm';

import {
  INSIGHTS_DEFAULT_PERIOD_DAYS,
  INSIGHTS_LIMITS,
  INSIGHTS_RANGE_DAYS,
  type TInsightsAgg,
  type TInsightsDimension,
  type TInsightsMetric
} from '@cio/utils/constants/insights';
import type { TInsightsFilter, TInsightsMeasure, TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { OperationalQueryError } from '../query-errors';
import { insightsMetricCtes } from './fragments';
import { INSIGHTS_REGISTRY } from './registry';
import { scopeCtes } from './scope';
import type {
  InsightsColumn,
  InsightsCompileContext,
  InsightsDimensionDefinition,
  InsightsFilterDefinition,
  InsightsMetricDefinition,
  InsightsOrderedItem,
  InsightsPushdown,
  InsightsScopeRef,
  InsightsSourceDefinition,
  InsightsValueType
} from './types';

const OUTLINE_DIMENSIONS: ReadonlySet<TInsightsDimension> = new Set(['exercise', 'section', 'lesson', 'question']);
const OUTLINE_METRICS: ReadonlySet<TInsightsMetric> = new Set(['now_at_item_id', 'now_at_title']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LOGIN_WINDOW_DAYS = 14;

type CompiledDimension = {
  id: TInsightsDimension;
  definition: InsightsDimensionDefinition;
  select: SQL[];
  groupBy: SQL[];
  columns: InsightsColumn[];
  orderBy: SQL;
};

type CompiledMeasure = {
  alias: string;
  select: SQL;
  column: InsightsColumn;
};

export type CompiledInsightsQuery = {
  query: SQL;
  columns: InsightsColumn[];
};

function invalidSpec(message: string): OperationalQueryError {
  return new OperationalQueryError(message, 'INSIGHTS_QUERY_INVALID', 400);
}

function alias(name: string): SQL {
  return sql`${sql.identifier(name)}`;
}

function outputValue(valueType: InsightsValueType, expression: SQL): SQL {
  if (valueType === 'date' || valueType === 'datetime') return sql`(to_json(${expression}) #>> '{}')`;

  if (valueType === 'integer') return sql`(${expression})::int`;

  if (valueType === 'number' || valueType === 'percent') return sql`(${expression})::float8`;

  return expression;
}

function aggregateSql(agg: TInsightsAgg, metric: InsightsMetricDefinition, firstDimensionKey: SQL | null): SQL {
  const value = metric.value;

  switch (agg) {
    case 'value':
      return sql`(array_agg(${value}))[1]`;
    case 'count':
      return sql`COUNT(*)`;
    case 'count_if':
      return sql`COUNT(*) FILTER (WHERE ${value})`;
    case 'sum':
      return sql`SUM(${value})`;
    case 'avg':
      return sql`ROUND(AVG(${value})::numeric, 1)`;
    case 'median':
      return sql`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${value})`;
    case 'p25':
      return sql`percentile_cont(0.25) WITHIN GROUP (ORDER BY ${value})`;
    case 'p75':
      return sql`percentile_cont(0.75) WITHIN GROUP (ORDER BY ${value})`;
    case 'rate':
      return sql`ROUND(AVG(CASE WHEN ${value} THEN 100.0 WHEN ${value} IS NOT NULL THEN 0 END), 1)`;
    case 'pooled':
      return sql`ROUND(SUM(${value}) * 100.0 / NULLIF(SUM(${metric.denominator}), 0), 1)`;
    case 'mode':
      return sql`mode() WITHIN GROUP (ORDER BY ${value})`;
    case 'running_count':
      if (!firstDimensionKey) throw invalidSpec('running_count needs one dimension');

      return sql`SUM(COUNT(*)) OVER (ORDER BY ${firstDimensionKey})`;
  }
}

function aggregateValueType(agg: TInsightsAgg, metric: InsightsMetricDefinition): InsightsValueType {
  if (agg === 'count' || agg === 'count_if' || agg === 'running_count') return 'integer';

  if (agg === 'rate' || agg === 'pooled') return 'percent';

  return metric.valueType;
}

function compileDimension(source: InsightsSourceDefinition, id: TInsightsDimension): CompiledDimension {
  const definition = source.dimensions[id];
  if (!definition) throw invalidSpec(`Dimension ${id} is not available on ${source.id}`);

  const select = [sql`${outputValue(definition.valueType, definition.key)} AS ${alias(`${id}_id`)}`];
  const groupBy = [definition.key];
  const columns: InsightsColumn[] = [{ key: `${id}_id`, role: 'dimension', valueType: definition.valueType }];

  if (definition.label) {
    select.push(sql`${definition.label} AS ${alias(`${id}_label`)}`);
    groupBy.push(definition.label);
    columns.push({ key: `${id}_label`, role: 'dimension', valueType: 'text' });
  }

  if (definition.rank) {
    select.push(sql`(${definition.rank})::int AS ${alias(`${id}_rank`)}`);
    groupBy.push(definition.rank);
    columns.push({ key: `${id}_rank`, role: 'dimension', valueType: 'integer' });
  }

  const orderBy = definition.rank ?? definition.label ?? definition.key;

  return { id, definition, select, groupBy, columns, orderBy };
}

function compileMeasure(
  source: InsightsSourceDefinition,
  measure: TInsightsMeasure,
  firstDimensionKey: SQL | null
): CompiledMeasure {
  const metric = source.metrics[measure.metric];
  if (!metric) throw invalidSpec(`Metric ${measure.metric} is not available on ${source.id}`);

  if (!metric.aggs.includes(measure.agg)) throw invalidSpec(`Metric ${measure.metric} does not support ${measure.agg}`);

  const measureAlias = `${measure.metric}__${measure.agg}`;
  const valueType = aggregateValueType(measure.agg, metric);
  const aggregate = aggregateSql(measure.agg, metric, firstDimensionKey);

  return {
    alias: measureAlias,
    select: sql`${outputValue(valueType, aggregate)} AS ${alias(measureAlias)}`,
    column: { key: measureAlias, role: 'measure', valueType }
  };
}

function assertFilterValue(definition: InsightsFilterDefinition, filter: TInsightsFilter): void {
  const values = Array.isArray(filter.value) ? filter.value : [filter.value];
  const isIdFilter = definition.kind === 'pushdown' || definition.valueType === 'id';

  if (isIdFilter && values.some((value) => typeof value !== 'string' || !UUID_PATTERN.test(value))) {
    throw invalidSpec(`Filter ${filter.field} needs uuid values`);
  }

  if (definition.kind === 'predicate' && definition.allowedValues) {
    const allowed = definition.allowedValues;
    if (values.some((value) => typeof value !== 'string' || !allowed.includes(value))) {
      throw invalidSpec(`Filter ${filter.field} has an unsupported value`);
    }
  }
}

function collectPushdown(source: InsightsSourceDefinition, filters: TInsightsFilter[]): InsightsPushdown {
  const pushdown: InsightsPushdown = {};

  for (const filter of filters) {
    const definition = source.filters[filter.field];
    if (!definition || definition.kind !== 'pushdown') continue;

    if (filter.op !== 'eq' && filter.op !== 'in') throw invalidSpec(`Filter ${filter.field} only supports eq and in`);

    assertFilterValue(definition, filter);
    const values = Array.isArray(filter.value) ? filter.value : [String(filter.value)];
    pushdown[definition.target] = values;
  }

  return pushdown;
}

function predicateSql(
  definition: Extract<InsightsFilterDefinition, { kind: 'predicate' }>,
  filter: TInsightsFilter
): SQL {
  const column = definition.column;

  switch (filter.op) {
    case 'eq':
      return sql`${column} = ${filter.value}`;
    case 'in':
      return sql`${column} IN (${sql.join(
        (filter.value as string[]).map((value) => sql`${value}`),
        sql`, `
      )})`;
    case 'gte':
      return sql`${column} >= ${filter.value}`;
    case 'lt':
      return sql`${column} < ${filter.value}`;
    case 'is_true':
      return sql`${column} IS TRUE`;
    case 'is_false':
      return sql`${column} IS NOT TRUE`;
  }
}

function compilePredicates(source: InsightsSourceDefinition, spec: TInsightsQuerySpec): SQL[] {
  const predicates: SQL[] = [];

  for (const filter of spec.filters) {
    const definition = source.filters[filter.field];
    if (!definition) throw invalidSpec(`Filter ${filter.field} is not available on ${source.id}`);

    if (definition.kind === 'pushdown') continue;

    if (!definition.ops.includes(filter.op)) throw invalidSpec(`Filter ${filter.field} does not support ${filter.op}`);

    assertFilterValue(definition, filter);
    predicates.push(predicateSql(definition, filter));
  }

  const search = spec.search?.trim();
  if (search && source.searchColumns?.length) {
    const pattern = `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
    predicates.push(sql`concat_ws(' ', ${sql.join([...source.searchColumns], sql`, `)}) ILIKE ${pattern} ESCAPE '\\'`);
  }

  return predicates;
}

function compileOrderBy(spec: TInsightsQuerySpec, dimensions: CompiledDimension[], measures: CompiledMeasure[]): SQL[] {
  const dimensionsById = new Map(dimensions.map((dimension) => [dimension.id as string, dimension]));
  const measureAliases = new Set(measures.map((measure) => measure.alias));
  const orderBy: SQL[] = [];

  for (const sort of spec.sort) {
    const direction = sort.dir === 'desc' ? sql`DESC` : sql`ASC`;
    const dimension = dimensionsById.get(sort.field);

    if (dimension) {
      orderBy.push(sql`${dimension.orderBy} ${direction} NULLS LAST`);
      continue;
    }

    if (!measureAliases.has(sort.field)) throw invalidSpec(`Cannot sort by ${sort.field}`);

    orderBy.push(sql`${alias(sort.field)} ${direction} NULLS LAST`);
  }

  for (const dimension of dimensions) {
    orderBy.push(sql`${dimension.orderBy} ASC NULLS LAST`, sql`${dimension.definition.key} ASC NULLS LAST`);
  }

  return orderBy;
}

/**
 * True when the spec needs course outline ranks, which the service must load and pass in as `orderedItems`.
 */
export function requiresOrderedItems(spec: Pick<TInsightsQuerySpec, 'dimensions' | 'measures'>): boolean {
  const hasOutlineDimension = spec.dimensions.some((dimension) => OUTLINE_DIMENSIONS.has(dimension));
  const hasOutlineMetric = spec.measures.some((measure) => OUTLINE_METRICS.has(measure.metric));

  return hasOutlineDimension || hasOutlineMetric;
}

/**
 * Compiles a validated spec into one parameterized query. Throws `OperationalQueryError` (400) for anything the
 * registry does not allow. Every value is a bound parameter; identifiers only ever come from the registry.
 */
export function compileInsightsQuery(
  spec: TInsightsQuerySpec,
  input: { scope: InsightsScopeRef; orderedItems: InsightsOrderedItem[] }
): CompiledInsightsQuery {
  const source = INSIGHTS_REGISTRY[spec.source];
  if (!source.scopeTypes.includes(input.scope.type)) {
    throw invalidSpec(`Source ${spec.source} is not available for ${input.scope.type} scope`);
  }

  const pushdown = collectPushdown(source, spec.filters);
  const byCohort =
    Boolean(source.requiresCohortBridge) || spec.dimensions.includes('cohort') || Boolean(pushdown.cohortIds);
  const rangeDays = INSIGHTS_RANGE_DAYS[spec.range];
  const context: InsightsCompileContext = {
    scope: input.scope,
    orderedItems: input.orderedItems,
    pushdown,
    byCohort,
    loginWindowDays: rangeDays ?? spec.days ?? DEFAULT_LOGIN_WINDOW_DAYS,
    rangeDays,
    periodDays: rangeDays ?? INSIGHTS_DEFAULT_PERIOD_DAYS
  };

  const dimensions = spec.dimensions.map((dimensionId) => compileDimension(source, dimensionId));
  const firstDimensionKey = dimensions[0]?.definition.key ?? null;
  const measures = spec.measures.map((measure) => compileMeasure(source, measure, firstDimensionKey));
  const predicates = compilePredicates(source, spec);
  const orderBy = compileOrderBy(spec, dimensions, measures);
  const limit = Math.min(spec.limit, INSIGHTS_LIMITS.maxExportRows);
  const offset = (spec.page - 1) * spec.limit;

  const selectList = [
    ...dimensions.flatMap((dimension) => dimension.select),
    ...measures.map((measure) => measure.select),
    sql`COUNT(*) OVER ()::int AS __total`
  ];
  const whereClause = predicates.length ? sql`WHERE ${sql.join(predicates, sql` AND `)}` : sql``;
  const groupByClause = dimensions.length
    ? sql`GROUP BY ${sql.join(
        dimensions.flatMap((dimension) => dimension.groupBy),
        sql`, `
      )}`
    : sql``;
  const havingClause = dimensions.length && spec.minGroupRows ? sql`HAVING COUNT(*) >= ${spec.minGroupRows}` : sql``;
  const orderByClause = orderBy.length ? sql`ORDER BY ${sql.join(orderBy, sql`, `)}` : sql``;

  const query = sql`
    WITH
      ${scopeCtes(context)},
      ${insightsMetricCtes(context)},
      base AS (${source.build(context)})
    SELECT ${sql.join(selectList, sql`, `)}
    FROM base
    ${whereClause}
    ${groupByClause}
    ${havingClause}
    ${orderByClause}
    LIMIT ${limit} OFFSET ${offset}`;

  const dimensionColumns = dimensions.flatMap((dimension) => dimension.columns);
  const measureColumns = measures.map((measure) => measure.column);

  return { query, columns: [...dimensionColumns, ...measureColumns] };
}
