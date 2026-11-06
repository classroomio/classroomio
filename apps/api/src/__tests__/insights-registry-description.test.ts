import { describe, expect, it } from 'vitest';

import {
  compileInsightsQuery,
  describeInsightsRegistry,
  INSIGHTS_REGISTRY,
  type InsightsScopeRef
} from '@cio/db/queries/insights';
import { ZInsightsQuerySpec } from '@cio/utils/validation/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const AGGS = ['value', 'count', 'count_if', 'sum', 'avg', 'median', 'p25', 'p75', 'rate', 'pooled', 'mode'] as const;

const SCOPE_CANDIDATES: Record<'cohort' | 'course' | 'org', InsightsScopeRef> = {
  cohort: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID },
  course: { orgId: ORG_ID, type: 'course', id: COHORT_ID },
  org: { orgId: ORG_ID, type: 'org', id: ORG_ID }
};

const REGISTRY_DESCRIPTION = describeInsightsRegistry();

function scopeFor(sourceId: string): InsightsScopeRef {
  const description = REGISTRY_DESCRIPTION[sourceId as keyof typeof REGISTRY_DESCRIPTION];

  return { orgId: ORG_ID, type: description.scopeTypes[0]!, id: COHORT_ID };
}

/** One spec per source the description can be checked against: first metric, first aggregation it allows. */
function sampleSpec(sourceId: string): Record<string, unknown> {
  const description = REGISTRY_DESCRIPTION[sourceId as keyof typeof REGISTRY_DESCRIPTION];
  const firstMetric = Object.keys(description.metrics)[0]!;
  const firstAgg = description.metrics[firstMetric]!.aggs[0]!;

  return {
    source: sourceId,
    dimensions: [],
    measures: [{ metric: firstMetric, agg: firstAgg === 'running_count' ? 'count' : firstAgg }]
  };
}

function compile(sourceId: string, overrides: Record<string, unknown> = {}, scope?: InsightsScopeRef) {
  const spec = ZInsightsQuerySpec.parse({ ...sampleSpec(sourceId), ...overrides, source: sourceId });

  return compileInsightsQuery(spec, { scope: scope ?? scopeFor(sourceId), orderedItems: [] });
}

/** The column type the compiler assigns a measure, so the description can be compared against real output. */
function measureValueType(metricDescription: { valueType: string }, agg: string): string {
  if (agg === 'count' || agg === 'count_if' || agg === 'running_count') return 'integer';

  if (agg === 'rate' || agg === 'pooled') return 'percent';

  return metricDescription.valueType;
}

describe('describeInsightsRegistry', () => {
  it('describes every registered source once', () => {
    expect(Object.keys(REGISTRY_DESCRIPTION).sort()).toEqual(Object.keys(INSIGHTS_REGISTRY).sort());
  });

  it('predicts the scope types the compiler accepts', () => {
    for (const [sourceId, sourceDescription] of Object.entries(REGISTRY_DESCRIPTION)) {
      expect(() => compile(sourceId, {}, scopeFor(sourceId))).not.toThrow();

      for (const scopeType of (['cohort', 'course', 'org'] as const).filter(
        (type) => !sourceDescription.scopeTypes.includes(type)
      )) {
        expect(() => compile(sourceId, {}, SCOPE_CANDIDATES[scopeType])).toThrow(
          new RegExp(`Source ${sourceId} is not available for ${scopeType}`)
        );
      }
    }
  });

  it('predicts the dimensions the compiler accepts, with their label and rank columns', () => {
    for (const [sourceId, sourceDescription] of Object.entries(REGISTRY_DESCRIPTION)) {
      for (const [dimensionId, dimensionDescription] of Object.entries(sourceDescription.dimensions)) {
        const expectedColumns = [`${dimensionId}_id`];
        if (dimensionDescription.hasLabel) expectedColumns.push(`${dimensionId}_label`);
        if (dimensionDescription.hasRank) expectedColumns.push(`${dimensionId}_rank`);

        const { columns } = compile(sourceId, { dimensions: [dimensionId] });
        const dimensionColumns = columns
          .filter((column) => column.key.startsWith(dimensionId))
          .map((column) => column.key)
          .sort();

        expect(dimensionColumns).toEqual([...expectedColumns].sort());
      }
    }
  });

  it('predicts the metrics and aggregations the compiler accepts', () => {
    for (const [sourceId, sourceDescription] of Object.entries(REGISTRY_DESCRIPTION)) {
      for (const [metric, metricDescription] of Object.entries(sourceDescription.metrics)) {
        for (const agg of metricDescription.aggs) {
          if (agg === 'running_count') {
            const firstDimension = Object.keys(sourceDescription.dimensions)[0] || 'student';

            expect(() =>
              compile(sourceId, { dimensions: [firstDimension], measures: [{ metric, agg }] })
            ).not.toThrow();
            continue;
          }

          const { columns } = compile(sourceId, { measures: [{ metric, agg }] });
          const measure = columns.find((column) => column.key === `${metric}__${agg}`);

          expect(measure).toMatchObject({
            role: 'measure',
            valueType: measureValueType(metricDescription, agg)
          });
        }

        const rejectedAggs = AGGS.filter((agg) => !metricDescription.aggs.includes(agg)).slice(0, 2);

        for (const rejectedAgg of rejectedAggs) {
          expect(() => compile(sourceId, { measures: [{ metric, agg: rejectedAgg }] })).toThrow();
        }
      }
    }
  });

  it('lists every compiled column of a sample spec in the description', () => {
    for (const [sourceId, sourceDescription] of Object.entries(REGISTRY_DESCRIPTION)) {
      const { columns } = compile(sourceId);

      for (const column of columns) {
        if (column.role === 'dimension') {
          const dimensionId = column.key.replace(/_(id|label|rank)$/, '');

          expect(sourceDescription.dimensions).toHaveProperty(dimensionId);
          continue;
        }

        const [metric] = column.key.split('__');

        expect(sourceDescription.metrics).toHaveProperty(metric!);
      }
    }
  });

  it('describes filters with kind, value type and supported ops', () => {
    for (const [sourceId, sourceDescription] of Object.entries(REGISTRY_DESCRIPTION)) {
      const source = INSIGHTS_REGISTRY[sourceId as keyof typeof INSIGHTS_REGISTRY];

      expect(Object.keys(sourceDescription.filters).sort()).toEqual(Object.keys(source.filters).sort());

      for (const filterDescription of Object.values(sourceDescription.filters)) {
        expect(filterDescription.ops.length).toBeGreaterThan(0);

        if (filterDescription.kind === 'pushdown') {
          expect(filterDescription.ops).toEqual(['eq', 'in']);
          expect(filterDescription.valueType).toBe('id');
        }

        if (filterDescription.allowedValues) {
          expect(filterDescription.allowedValues.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('marks search exactly where the compiler accepts a term', () => {
    for (const [sourceId, sourceDescription] of Object.entries(REGISTRY_DESCRIPTION)) {
      const source = INSIGHTS_REGISTRY[sourceId as keyof typeof INSIGHTS_REGISTRY];

      expect(sourceDescription.hasSearch).toBe(Boolean(source.searchColumns?.length));
    }
  });
});
