import * as z from 'zod';

import {
  ANALYTICS_AGGS,
  ANALYTICS_BREAKDOWN_GROUPS,
  ANALYTICS_DIMENSIONS,
  ANALYTICS_FILTER_FIELDS,
  ANALYTICS_FILTER_OPS,
  ANALYTICS_METRICS,
  ANALYTICS_RANGES,
  ANALYTICS_SCOPE_TYPES,
  ANALYTICS_SOURCES,
  ANALYTICS_STATUSES,
  ANALYTICS_VIZ_TYPES
} from '../../constants/analytics';
import { ZPublicApiAnalyticsQuerySpec } from './analytics';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const ANALYTICS_VALUE_TYPE_VALUES = [
  'id',
  'text',
  'integer',
  'number',
  'percent',
  'boolean',
  'date',
  'datetime'
] as const;
const ZAnalyticsValueType = z.enum(ANALYTICS_VALUE_TYPE_VALUES).describe('The kind of value a column holds.');
const timestamp = z.string();

export const ZPublicApiAnalyticsMetricDescriptionResponse = z.object({
  valueType: ZAnalyticsValueType,
  aggs: z.array(z.enum(ANALYTICS_AGGS)),
  description: z.string()
});

export const ZPublicApiAnalyticsDimensionDescriptionResponse = z.object({
  valueType: ZAnalyticsValueType,
  hasLabel: z.boolean(),
  hasRank: z.boolean(),
  description: z.string()
});

export const ZPublicApiAnalyticsFilterDescriptionResponse = z.object({
  kind: z.enum(['pushdown', 'predicate']),
  valueType: ZAnalyticsValueType,
  ops: z.array(z.enum(ANALYTICS_FILTER_OPS)),
  allowedValues: z.array(z.string()).optional(),
  description: z.string()
});

export const ZPublicApiAnalyticsCatalogSourceResponse = z.object({
  id: z.enum(ANALYTICS_SOURCES),
  description: z.string(),
  scopeTypes: z.array(z.enum(ANALYTICS_SCOPE_TYPES)),
  hasSearch: z.boolean(),
  dimensions: z.partialRecord(z.enum(ANALYTICS_DIMENSIONS), ZPublicApiAnalyticsDimensionDescriptionResponse),
  metrics: z.partialRecord(z.enum(ANALYTICS_METRICS), ZPublicApiAnalyticsMetricDescriptionResponse),
  filters: z.partialRecord(z.enum(ANALYTICS_FILTER_FIELDS), ZPublicApiAnalyticsFilterDescriptionResponse)
});

export const ZPublicApiAnalyticsCatalogResponse = z.object({
  sources: z.record(z.enum(ANALYTICS_SOURCES), ZPublicApiAnalyticsCatalogSourceResponse),
  widgets: z
    .record(z.string(), z.string())
    .describe('Preset widget ids with what each kind of widget in the dashboards shows.')
});

export const ZPublicApiAnalyticsColumnResponse = z.object({
  key: z.string().describe('Column key, the same key rows use, and what sort fields address.'),
  role: z.enum(['dimension', 'measure']),
  valueType: ZAnalyticsValueType
});

export const ZPublicApiAnalyticsQueryDataResponse = z.object({
  columns: z.array(ZPublicApiAnalyticsColumnResponse),
  rows: z
    .array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .describe('One object per result row, keyed by column key.')
});

export const ZPublicApiAnalyticsQueryMeta = z.object({
  generatedAt: timestamp.describe('When the result was computed (ISO 8601).'),
  cached: z.boolean().describe('Whether the response came from the cache for this scope and spec.'),
  range: z.enum(ANALYTICS_RANGES).describe('The range actually used; the Free plan sees at most the last 7 days.')
});

export const ZPublicApiAnalyticsWidgetResultResponse = ZPublicApiAnalyticsQueryDataResponse.extend({
  total: z.number().describe('Total rows matched, across all pages.')
});

export const ZPublicApiAnalyticsScopeCourseResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  isGrouped: z.boolean(),
  hasPassRequired: z.boolean()
});

export const ZPublicApiAnalyticsScopeResponse = z.object({
  type: z.enum(ANALYTICS_SCOPE_TYPES),
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  studentCount: z.number(),
  pendingCount: z.number(),
  cohortCount: z.number(),
  activeCohortCount: z.number(),
  studentTarget: z.number().nullable(),
  seatsUsed: z
    .number()
    .nullable()
    .describe(
      "Student seats in use under the plan's student limit, including students who have not joined yet. Org scope only; null otherwise."
    ),
  seatsNotJoined: z
    .number()
    .nullable()
    .describe(
      'Seats held by students who were added or invited but have not joined, while their invitation is not revoked or expired. Org scope only; null otherwise.'
    ),
  courses: z.array(ZPublicApiAnalyticsScopeCourseResponse)
});

export const ZPublicApiAnalyticsSnapshotSelectionResponse = z.object({
  courseId: z.string().uuid().nullable(),
  exerciseId: z.string().uuid().nullable(),
  breakdown: z.enum(ANALYTICS_BREAKDOWN_GROUPS),
  range: z.enum(ANALYTICS_RANGES)
});

export const ZPublicApiAnalyticsSnapshotWidgetSpecResponse = ZPublicApiAnalyticsQuerySpec.safeExtend({
  minGroupRows: z.number().int().min(1).max(1000).optional()
});

export const ZPublicApiAnalyticsSnapshotWidgetResponse = z.object({
  id: z.string(),
  viz: z.enum(ANALYTICS_VIZ_TYPES),
  description: z.string(),
  spec: ZPublicApiAnalyticsSnapshotWidgetSpecResponse,
  result: ZPublicApiAnalyticsWidgetResultResponse.nullable(),
  errorCode: z
    .string()
    .nullable()
    .describe('Set when this widget could not be computed; the other widgets still carry their result.')
});

export const ZPublicApiAnalyticsSnapshotResponse = z.object({
  scope: ZPublicApiAnalyticsScopeResponse,
  selection: ZPublicApiAnalyticsSnapshotSelectionResponse,
  generatedAt: timestamp.describe('When the snapshot was assembled (ISO 8601).'),
  widgets: z.array(ZPublicApiAnalyticsSnapshotWidgetResponse)
});

export const ZPublicApiAnalyticsStudentRowResponse = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  progressPct: z.number().nullable(),
  avgScorePct: z.number().nullable(),
  coursesCompleted: z.number().nullable(),
  coursesTotal: z.number().nullable(),
  videoPct: z.number().nullable(),
  attendancePct: z.number().nullable(),
  certificates: z.number().nullable(),
  lastLoginAt: timestamp.nullable(),
  isOverdue: z.boolean().nullable(),
  status: z.enum(ANALYTICS_STATUSES).nullable(),
  nowAt: z.string().nullable().describe('Title of the item the student should do next.')
});
