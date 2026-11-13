import { sql, type SQL } from 'drizzle-orm';

import type { TAnalyticsAgg, TAnalyticsFilterOp } from '@cio/utils/constants/analytics';

import type {
  AnalyticsDimensionDefinition,
  AnalyticsFilterDefinition,
  AnalyticsMetricDefinition,
  AnalyticsValueType
} from '../types';

const NUMBER_AGGS = ['value', 'sum', 'avg', 'median', 'p25', 'p75'] as const satisfies readonly TAnalyticsAgg[];
const PERCENT_AGGS = ['value', 'avg', 'median', 'p25', 'p75'] as const satisfies readonly TAnalyticsAgg[];
const FLAG_AGGS = ['value', 'count_if', 'rate'] as const satisfies readonly TAnalyticsAgg[];
const TEXT_AGGS = ['value', 'mode'] as const satisfies readonly TAnalyticsAgg[];
const INTEGER_AGGS = ['value', 'sum'] as const satisfies readonly TAnalyticsAgg[];

export function baseColumn(name: string): SQL {
  return sql.raw(`base.${name}`);
}

export const rowsMetric: AnalyticsMetricDefinition = {
  valueType: 'integer',
  value: sql`1`,
  aggs: ['count', 'running_count']
};

export function percentMetric(column: string): AnalyticsMetricDefinition {
  return { valueType: 'percent', value: baseColumn(column), aggs: PERCENT_AGGS };
}

export function numberMetric(column: string): AnalyticsMetricDefinition {
  return { valueType: 'number', value: baseColumn(column), aggs: NUMBER_AGGS };
}

export function integerMetric(column: string): AnalyticsMetricDefinition {
  return { valueType: 'integer', value: baseColumn(column), aggs: INTEGER_AGGS };
}

export function flagMetric(column: string): AnalyticsMetricDefinition {
  return { valueType: 'boolean', value: baseColumn(column), aggs: FLAG_AGGS };
}

export function textMetric(column: string): AnalyticsMetricDefinition {
  return { valueType: 'text', value: baseColumn(column), aggs: TEXT_AGGS };
}

export function valueMetric(valueType: AnalyticsValueType, column: string): AnalyticsMetricDefinition {
  return { valueType, value: baseColumn(column), aggs: ['value'] };
}

/**
 * A ratio aggregated as one pooled percentage, not an average of per-row percentages.
 */
export function pooledMetric(numerator: SQL, denominator: SQL): AnalyticsMetricDefinition {
  return { valueType: 'percent', value: numerator, denominator, aggs: ['pooled'] };
}

export function idDimension(
  keyColumn: string,
  labelColumn?: string,
  rankColumn?: string
): AnalyticsDimensionDefinition {
  return {
    valueType: 'id',
    key: baseColumn(keyColumn),
    label: labelColumn ? baseColumn(labelColumn) : undefined,
    rank: rankColumn ? baseColumn(rankColumn) : undefined
  };
}

/** A progress dimension bucketed into 0 to 4, with 100% in the top bucket; null stays null. */
export function progressBucketDimension(column: string): AnalyticsDimensionDefinition {
  const value = baseColumn(column);

  return {
    valueType: 'integer',
    key: sql`CASE WHEN ${value} >= 100 THEN 4 ELSE FLOOR(${value} / 25)::int END`
  };
}

/** A score dimension bucketed into tens, clamped to 4 through 9; null scores stay null. */
export function scoreBucketDimension(column: string): AnalyticsDimensionDefinition {
  const value = baseColumn(column);

  return {
    valueType: 'integer',
    key: sql`CASE WHEN ${value} IS NULL THEN NULL ELSE GREATEST(4, LEAST(9, FLOOR(${value} / 10)::int)) END`
  };
}

export function predicateFilter(
  column: string,
  valueType: AnalyticsValueType,
  ops: readonly TAnalyticsFilterOp[],
  allowedValues?: readonly string[]
): AnalyticsFilterDefinition {
  return { kind: 'predicate', column: baseColumn(column), valueType, ops, allowedValues };
}

export function flagFilter(column: string): AnalyticsFilterDefinition {
  return predicateFilter(column, 'boolean', ['is_true', 'is_false']);
}

export const scopePushdownFilters = {
  course: { kind: 'pushdown', target: 'courseIds' },
  cohort: { kind: 'pushdown', target: 'cohortIds' },
  student: { kind: 'pushdown', target: 'studentIds' }
} as const satisfies Record<string, AnalyticsFilterDefinition>;
