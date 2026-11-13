import * as z from 'zod';

import {
  ANALYTICS_AGGS,
  ANALYTICS_DIMENSIONS,
  ANALYTICS_FILTER_FIELDS,
  ANALYTICS_FILTER_OPS,
  ANALYTICS_LIMITS,
  ANALYTICS_LOGIN_WINDOWS,
  ANALYTICS_METRICS,
  ANALYTICS_RANGES,
  ANALYTICS_SCOPE_TYPES,
  ANALYTICS_SOURCES
} from '../../constants/analytics';

const ZAnalyticsFilterScalar = z.union([z.string().min(1).max(64), z.number().finite()]);

const ZAnalyticsFilterValues = z.array(z.string().uuid()).min(1).max(ANALYTICS_LIMITS.maxFilterValues);

function hasValueForOp(filter: { op: (typeof ANALYTICS_FILTER_OPS)[number]; value?: unknown }): boolean {
  if (filter.op === 'is_true' || filter.op === 'is_false') return filter.value === undefined;

  if (filter.op === 'in') return Array.isArray(filter.value);

  return filter.value !== undefined && !Array.isArray(filter.value);
}

export const ZAnalyticsScope = z.object({
  type: z.enum(ANALYTICS_SCOPE_TYPES),
  id: z.string().uuid()
});

export const ZAnalyticsFilter = z
  .object({
    field: z.enum(ANALYTICS_FILTER_FIELDS),
    op: z.enum(ANALYTICS_FILTER_OPS),
    value: z.union([ZAnalyticsFilterScalar, ZAnalyticsFilterValues]).optional()
  })
  .refine(hasValueForOp, { path: ['value'] });

export const ZAnalyticsMeasure = z.object({
  metric: z.enum(ANALYTICS_METRICS),
  agg: z.enum(ANALYTICS_AGGS)
});

export const ZAnalyticsSort = z.object({
  field: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(64),
  dir: z.enum(['asc', 'desc']).default('asc')
});

export const ZAnalyticsQuerySpec = z
  .object({
    source: z.enum(ANALYTICS_SOURCES),
    measures: z.array(ZAnalyticsMeasure).min(1).max(ANALYTICS_LIMITS.maxMeasures),
    dimensions: z.array(z.enum(ANALYTICS_DIMENSIONS)).max(2).default([]),
    filters: z.array(ZAnalyticsFilter).max(10).default([]),
    sort: z.array(ZAnalyticsSort).max(3).default([]),
    search: z.string().trim().max(ANALYTICS_LIMITS.maxSearchLength).optional(),
    limit: z.number().int().min(1).max(ANALYTICS_LIMITS.maxRows).default(ANALYTICS_LIMITS.pageSize),
    page: z.number().int().min(1).max(ANALYTICS_LIMITS.maxPage).default(1),
    minGroupRows: z.number().int().min(1).max(1000).optional(),
    days: z
      .number()
      .int()
      .refine((days) => (ANALYTICS_LOGIN_WINDOWS as readonly number[]).includes(days))
      .optional(),
    range: z.enum(ANALYTICS_RANGES).default('all')
  })
  .superRefine((spec, context) => {
    if ((spec.page - 1) * spec.limit > ANALYTICS_LIMITS.maxOffset) {
      context.addIssue({
        code: 'custom',
        message: `page and limit exceed the ${ANALYTICS_LIMITS.maxOffset} row offset limit`,
        path: ['page']
      });
    }
  });

export const ZAnalyticsExportSpec = ZAnalyticsQuerySpec.safeExtend({
  limit: z.number().int().min(1).max(ANALYTICS_LIMITS.maxExportRows).default(ANALYTICS_LIMITS.maxExportRows)
});

export const ZAnalyticsQueryRequest = z.object({
  scope: ZAnalyticsScope,
  spec: ZAnalyticsQuerySpec,
  refresh: z.boolean().optional()
});

export const ZAnalyticsExportRequest = z.object({
  scope: ZAnalyticsScope,
  spec: ZAnalyticsExportSpec
});

/**
 * One request for a student export and the exercise cells the document needs. The server resolves the matching
 * students first, then reads their exercise results in bounded chunks, so the client never assembles a second
 * capped query of its own.
 */
export const ZAnalyticsStudentExportRequest = z.object({
  scope: ZAnalyticsScope,
  studentSpec: ZAnalyticsExportSpec,
  exerciseSpec: ZAnalyticsExportSpec.optional()
});

export const ZAnalyticsDashboardParam = z.object({
  scopeType: z.enum(ANALYTICS_SCOPE_TYPES),
  scopeId: z.string().uuid()
});

export type TAnalyticsScope = z.infer<typeof ZAnalyticsScope>;
export type TAnalyticsFilter = z.infer<typeof ZAnalyticsFilter>;
export type TAnalyticsMeasure = z.infer<typeof ZAnalyticsMeasure>;
export type TAnalyticsQuerySpec = z.infer<typeof ZAnalyticsQuerySpec>;
export type TAnalyticsQuerySpecInput = z.input<typeof ZAnalyticsQuerySpec>;
export type TAnalyticsQueryRequest = z.infer<typeof ZAnalyticsQueryRequest>;
export type TAnalyticsExportRequest = z.infer<typeof ZAnalyticsExportRequest>;
export type TAnalyticsStudentExportRequest = z.infer<typeof ZAnalyticsStudentExportRequest>;
export type TAnalyticsDashboardParam = z.infer<typeof ZAnalyticsDashboardParam>;
