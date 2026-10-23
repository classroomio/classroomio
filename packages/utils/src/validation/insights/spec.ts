import * as z from 'zod';

import {
  INSIGHTS_AGGS,
  INSIGHTS_DIMENSIONS,
  INSIGHTS_FILTER_FIELDS,
  INSIGHTS_FILTER_OPS,
  INSIGHTS_LIMITS,
  INSIGHTS_LOGIN_WINDOWS,
  INSIGHTS_METRICS,
  INSIGHTS_RANGES,
  INSIGHTS_SCOPE_TYPES,
  INSIGHTS_SOURCES
} from '../../constants/insights';

const ZInsightsFilterScalar = z.union([z.string().min(1).max(64), z.number().finite()]);

const ZInsightsFilterValues = z.array(z.string().uuid()).min(1).max(INSIGHTS_LIMITS.maxFilterValues);

function hasValueForOp(filter: { op: (typeof INSIGHTS_FILTER_OPS)[number]; value?: unknown }): boolean {
  if (filter.op === 'is_true' || filter.op === 'is_false') return filter.value === undefined;

  if (filter.op === 'in') return Array.isArray(filter.value);

  return filter.value !== undefined && !Array.isArray(filter.value);
}

export const ZInsightsScope = z.object({
  type: z.enum(INSIGHTS_SCOPE_TYPES),
  id: z.string().uuid()
});

export const ZInsightsFilter = z
  .object({
    field: z.enum(INSIGHTS_FILTER_FIELDS),
    op: z.enum(INSIGHTS_FILTER_OPS),
    value: z.union([ZInsightsFilterScalar, ZInsightsFilterValues]).optional()
  })
  .refine(hasValueForOp, { path: ['value'] });

export const ZInsightsMeasure = z.object({
  metric: z.enum(INSIGHTS_METRICS),
  agg: z.enum(INSIGHTS_AGGS)
});

export const ZInsightsSort = z.object({
  field: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(64),
  dir: z.enum(['asc', 'desc']).default('asc')
});

export const ZInsightsQuerySpec = z
  .object({
    source: z.enum(INSIGHTS_SOURCES),
    measures: z.array(ZInsightsMeasure).min(1).max(INSIGHTS_LIMITS.maxMeasures),
    dimensions: z.array(z.enum(INSIGHTS_DIMENSIONS)).max(2).default([]),
    filters: z.array(ZInsightsFilter).max(10).default([]),
    sort: z.array(ZInsightsSort).max(3).default([]),
    search: z.string().trim().max(INSIGHTS_LIMITS.maxSearchLength).optional(),
    limit: z.number().int().min(1).max(INSIGHTS_LIMITS.maxRows).default(INSIGHTS_LIMITS.pageSize),
    page: z.number().int().min(1).max(INSIGHTS_LIMITS.maxPage).default(1),
    minGroupRows: z.number().int().min(1).max(1000).optional(),
    days: z
      .number()
      .int()
      .refine((days) => (INSIGHTS_LOGIN_WINDOWS as readonly number[]).includes(days))
      .optional(),
    range: z.enum(INSIGHTS_RANGES).default('all')
  })
  .superRefine((spec, context) => {
    if ((spec.page - 1) * spec.limit > INSIGHTS_LIMITS.maxOffset) {
      context.addIssue({
        code: 'custom',
        message: `page and limit exceed the ${INSIGHTS_LIMITS.maxOffset} row offset limit`,
        path: ['page']
      });
    }
  });

export const ZInsightsExportSpec = ZInsightsQuerySpec.safeExtend({
  limit: z.number().int().min(1).max(INSIGHTS_LIMITS.maxExportRows).default(INSIGHTS_LIMITS.maxExportRows)
});

export const ZInsightsQueryRequest = z.object({
  scope: ZInsightsScope,
  spec: ZInsightsQuerySpec,
  refresh: z.boolean().optional()
});

export const ZInsightsExportRequest = z.object({
  scope: ZInsightsScope,
  spec: ZInsightsExportSpec
});

export const ZInsightsDashboardParam = z.object({
  scopeType: z.enum(INSIGHTS_SCOPE_TYPES),
  scopeId: z.string().uuid()
});

export type TInsightsScope = z.infer<typeof ZInsightsScope>;
export type TInsightsFilter = z.infer<typeof ZInsightsFilter>;
export type TInsightsMeasure = z.infer<typeof ZInsightsMeasure>;
export type TInsightsQuerySpec = z.infer<typeof ZInsightsQuerySpec>;
export type TInsightsQuerySpecInput = z.input<typeof ZInsightsQuerySpec>;
export type TInsightsQueryRequest = z.infer<typeof ZInsightsQueryRequest>;
export type TInsightsExportRequest = z.infer<typeof ZInsightsExportRequest>;
export type TInsightsDashboardParam = z.infer<typeof ZInsightsDashboardParam>;
