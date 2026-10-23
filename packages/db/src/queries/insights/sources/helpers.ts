import { sql, type SQL } from 'drizzle-orm';

import type { TInsightsAgg, TInsightsFilterOp } from '@cio/utils/constants/insights';

import type {
  InsightsDimensionDefinition,
  InsightsFilterDefinition,
  InsightsMetricDefinition,
  InsightsValueType
} from '../types';

const NUMBER_AGGS = ['value', 'sum', 'avg', 'median', 'p25', 'p75'] as const satisfies readonly TInsightsAgg[];
const PERCENT_AGGS = ['value', 'avg', 'median', 'p25', 'p75'] as const satisfies readonly TInsightsAgg[];
const FLAG_AGGS = ['value', 'count_if', 'rate'] as const satisfies readonly TInsightsAgg[];
const TEXT_AGGS = ['value', 'mode'] as const satisfies readonly TInsightsAgg[];
const INTEGER_AGGS = ['value', 'sum'] as const satisfies readonly TInsightsAgg[];

export function baseColumn(name: string): SQL {
  return sql.raw(`base.${name}`);
}

export const rowsMetric: InsightsMetricDefinition = {
  valueType: 'integer',
  value: sql`1`,
  aggs: ['count', 'running_count']
};

export function percentMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'percent', value: baseColumn(column), aggs: PERCENT_AGGS };
}

export function numberMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'number', value: baseColumn(column), aggs: NUMBER_AGGS };
}

export function integerMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'integer', value: baseColumn(column), aggs: INTEGER_AGGS };
}

export function flagMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'boolean', value: baseColumn(column), aggs: FLAG_AGGS };
}

export function textMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'text', value: baseColumn(column), aggs: TEXT_AGGS };
}

export function valueMetric(valueType: InsightsValueType, column: string): InsightsMetricDefinition {
  return { valueType, value: baseColumn(column), aggs: ['value'] };
}

export function pooledMetric(numerator: SQL, denominator: SQL): InsightsMetricDefinition {
  return { valueType: 'percent', value: numerator, denominator, aggs: ['pooled'] };
}

export function idDimension(keyColumn: string, labelColumn?: string, rankColumn?: string): InsightsDimensionDefinition {
  return {
    valueType: 'id',
    key: baseColumn(keyColumn),
    label: labelColumn ? baseColumn(labelColumn) : undefined,
    rank: rankColumn ? baseColumn(rankColumn) : undefined
  };
}

export function progressBucketDimension(column: string): InsightsDimensionDefinition {
  const value = baseColumn(column);

  return {
    valueType: 'integer',
    key: sql`CASE WHEN ${value} >= 100 THEN 4 ELSE FLOOR(${value} / 25)::int END`
  };
}

export function scoreBucketDimension(column: string): InsightsDimensionDefinition {
  const value = baseColumn(column);

  return {
    valueType: 'integer',
    key: sql`CASE WHEN ${value} IS NULL THEN NULL ELSE GREATEST(4, LEAST(9, FLOOR(${value} / 10)::int)) END`
  };
}

export function predicateFilter(
  column: string,
  valueType: InsightsValueType,
  ops: readonly TInsightsFilterOp[],
  allowedValues?: readonly string[]
): InsightsFilterDefinition {
  return { kind: 'predicate', column: baseColumn(column), valueType, ops, allowedValues };
}

export function flagFilter(column: string): InsightsFilterDefinition {
  return predicateFilter(column, 'boolean', ['is_true', 'is_false']);
}

export const scopePushdownFilters = {
  course: { kind: 'pushdown', target: 'courseIds' },
  cohort: { kind: 'pushdown', target: 'cohortIds' },
  learner: { kind: 'pushdown', target: 'learnerIds' }
} as const satisfies Record<string, InsightsFilterDefinition>;
