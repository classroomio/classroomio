import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  INSIGHTS_LIMITS,
  ZInsightsDashboardParam,
  ZInsightsExportRequest,
  ZInsightsExportSpec,
  ZInsightsFilter,
  ZInsightsMeasure,
  ZInsightsQueryRequest,
  ZInsightsQuerySpec,
  ZInsightsScope,
  ZInsightsSort,
  ZInsightsWidget,
  ZRemindOverdueCohortGoals
} from '../src';

const schemasToSnapshot = {
  ZInsightsScope,
  ZInsightsFilter,
  ZInsightsMeasure,
  ZInsightsSort,
  ZInsightsQuerySpec,
  ZInsightsExportSpec,
  ZInsightsQueryRequest,
  ZInsightsExportRequest,
  ZInsightsDashboardParam,
  ZInsightsWidget,
  ZRemindOverdueCohortGoals
};

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('insights spec contract snapshots', () => {
  it.each(Object.entries(schemasToSnapshot))('%s preserves its contract shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });
});

describe('ZInsightsQuerySpec defaults', () => {
  it('applies standard query defaults', () => {
    const parsed = ZInsightsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }]
    });

    expect(parsed.dimensions).toEqual([]);
    expect(parsed.filters).toEqual([]);
    expect(parsed.sort).toEqual([]);
    expect(parsed.limit).toBe(INSIGHTS_LIMITS.pageSize);
    expect(parsed.page).toBe(1);
    expect(parsed.search).toBeUndefined();
    expect(parsed.days).toBeUndefined();
    expect(parsed.minGroupRows).toBeUndefined();
  });

  it('applies export limit defaults to maxExportRows', () => {
    const parsed = ZInsightsExportSpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }]
    });

    expect(parsed.limit).toBe(INSIGHTS_LIMITS.maxExportRows);
  });
});

describe('ZInsightsQuerySpec limits and constraints', () => {
  it('rejects empty measures', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: []
    });

    expect(result.success).toBe(false);
  });

  it('rejects measures exceeding maxMeasures', () => {
    const measures = Array.from({ length: INSIGHTS_LIMITS.maxMeasures + 1 }, () => ({
      metric: 'rows' as const,
      agg: 'count' as const
    }));

    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 2 dimensions', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      dimensions: ['student', 'course', 'cohort']
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 10 filters', () => {
    const filters = Array.from({ length: 11 }, () => ({
      field: 'is_inactive' as const,
      op: 'is_true' as const
    }));

    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 3 sorts', () => {
    const sort = [
      { field: 'a', dir: 'asc' as const },
      { field: 'b', dir: 'desc' as const },
      { field: 'c', dir: 'asc' as const },
      { field: 'd', dir: 'desc' as const }
    ];

    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      sort
    });

    expect(result.success).toBe(false);
  });

  it('rejects a page whose row offset exceeds maxOffset', () => {
    const tooFar = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      limit: 30,
      page: INSIGHTS_LIMITS.maxPage
    });

    expect(tooFar.success).toBe(false);

    const atLimit = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      limit: 25,
      page: INSIGHTS_LIMITS.maxPage
    });

    expect(atLimit.success).toBe(true);
  });

  it('rejects search string exceeding maxSearchLength', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      search: 'a'.repeat(INSIGHTS_LIMITS.maxSearchLength + 1)
    });

    expect(result.success).toBe(false);
  });

  it('rejects query limit above maxRows', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      limit: INSIGHTS_LIMITS.maxRows + 1
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-standard days window', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'login_day',
      measures: [{ metric: 'rows', agg: 'count' }],
      days: 21
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid days window (7, 14, 30)', () => {
    for (const days of [7, 14, 30]) {
      const parsed = ZInsightsQuerySpec.parse({
        source: 'login_day',
        measures: [{ metric: 'rows', agg: 'count' }],
        days
      });

      expect(parsed.days).toBe(days);
    }
  });
});

describe('rejection of unknown identifiers', () => {
  it('rejects unknown source', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'invalid_source',
      measures: [{ metric: 'rows', agg: 'count' }]
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown metric', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'unknown_metric', agg: 'count' }]
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown aggregation', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'unknown_agg' }]
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown dimension', () => {
    const result = ZInsightsQuerySpec.safeParse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      dimensions: ['unknown_dimension']
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown filter field', () => {
    const result = ZInsightsFilter.safeParse({
      field: 'unknown_field',
      op: 'is_true'
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown filter op', () => {
    const result = ZInsightsFilter.safeParse({
      field: 'is_inactive',
      op: 'not_an_op'
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown viz in widget', () => {
    const result = ZInsightsWidget.safeParse({
      id: 'test_widget',
      titleKey: 'title',
      viz: 'unknown_chart',
      span: 6,
      spec: {
        source: 'student',
        measures: [{ metric: 'rows', agg: 'count' }]
      }
    });

    expect(result.success).toBe(false);
  });
});

describe('ZInsightsFilter op and value refinement', () => {
  it('accepts boolean ops without value', () => {
    expect(ZInsightsFilter.safeParse({ field: 'is_inactive', op: 'is_true' }).success).toBe(true);
    expect(ZInsightsFilter.safeParse({ field: 'is_inactive', op: 'is_false' }).success).toBe(true);
  });

  it('rejects boolean ops with a value', () => {
    expect(ZInsightsFilter.safeParse({ field: 'is_inactive', op: 'is_true', value: true }).success).toBe(false);
    expect(ZInsightsFilter.safeParse({ field: 'is_inactive', op: 'is_false', value: false }).success).toBe(false);
  });

  it('accepts scalar ops with scalar value', () => {
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'eq', value: VALID_UUID }).success).toBe(true);
    expect(ZInsightsFilter.safeParse({ field: 'avg_score_pct', op: 'gte', value: 50 }).success).toBe(true);
    expect(ZInsightsFilter.safeParse({ field: 'avg_score_pct', op: 'lt', value: 65 }).success).toBe(true);
  });

  it('rejects scalar ops with array value or missing value', () => {
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'eq', value: [VALID_UUID] }).success).toBe(false);
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'eq' }).success).toBe(false);
  });

  it('accepts in op with array of UUIDs', () => {
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'in', value: [VALID_UUID] }).success).toBe(true);
  });

  it('rejects in op with non-array or non-UUID values', () => {
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'in', value: VALID_UUID }).success).toBe(false);
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'in', value: ['not-a-uuid'] }).success).toBe(false);
    expect(ZInsightsFilter.safeParse({ field: 'course', op: 'in', value: [] }).success).toBe(false);
  });
});

describe('ZRemindOverdueCohortGoals', () => {
  it('accepts empty object', () => {
    expect(ZRemindOverdueCohortGoals.safeParse({}).success).toBe(true);
  });

  it('accepts optional courseId UUID', () => {
    expect(ZRemindOverdueCohortGoals.safeParse({ courseId: VALID_UUID }).success).toBe(true);
  });

  it('rejects invalid courseId', () => {
    expect(ZRemindOverdueCohortGoals.safeParse({ courseId: 'invalid-uuid' }).success).toBe(false);
  });
});
