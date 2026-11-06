import * as z from 'zod';

import {
  INSIGHTS_AGGS,
  INSIGHTS_BREAKDOWN_GROUPS,
  INSIGHTS_DIMENSIONS,
  INSIGHTS_FILTER_FIELDS,
  INSIGHTS_FILTER_OPS,
  INSIGHTS_METRICS,
  INSIGHTS_RANGES,
  INSIGHTS_SCOPE_TYPES,
  INSIGHTS_SOURCES,
  INSIGHTS_STATUSES,
  INSIGHTS_VIZ_TYPES
} from '../../constants/insights';
import { ZPublicApiInsightsQuerySpec } from './insights';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const INSIGHTS_VALUE_TYPE_VALUES = [
  'id',
  'text',
  'integer',
  'number',
  'percent',
  'boolean',
  'date',
  'datetime'
] as const;
const ZInsightsValueType = z.enum(INSIGHTS_VALUE_TYPE_VALUES).describe('The kind of value a column holds.');
const timestamp = z.string();

export const ZPublicApiInsightsMetricDescriptionResponse = z.object({
  valueType: ZInsightsValueType,
  aggs: z.array(z.enum(INSIGHTS_AGGS)),
  description: z.string()
});

export const ZPublicApiInsightsDimensionDescriptionResponse = z.object({
  valueType: ZInsightsValueType,
  hasLabel: z.boolean(),
  hasRank: z.boolean(),
  description: z.string()
});

export const ZPublicApiInsightsFilterDescriptionResponse = z.object({
  kind: z.enum(['pushdown', 'predicate']),
  valueType: ZInsightsValueType,
  ops: z.array(z.enum(INSIGHTS_FILTER_OPS)),
  allowedValues: z.array(z.string()).optional(),
  description: z.string()
});

export const ZPublicApiInsightsCatalogSourceResponse = z.object({
  id: z.enum(INSIGHTS_SOURCES),
  description: z.string(),
  scopeTypes: z.array(z.enum(INSIGHTS_SCOPE_TYPES)),
  hasSearch: z.boolean(),
  dimensions: z.record(z.enum(INSIGHTS_DIMENSIONS), ZPublicApiInsightsDimensionDescriptionResponse),
  metrics: z.record(z.enum(INSIGHTS_METRICS), ZPublicApiInsightsMetricDescriptionResponse),
  filters: z.record(z.enum(INSIGHTS_FILTER_FIELDS), ZPublicApiInsightsFilterDescriptionResponse)
});

export const ZPublicApiInsightsCatalogResponse = z.object({
  sources: z.record(z.enum(INSIGHTS_SOURCES), ZPublicApiInsightsCatalogSourceResponse),
  widgets: z
    .record(z.string(), z.string())
    .describe('Preset widget ids with what each kind of widget in the dashboards shows.')
});

export const ZPublicApiInsightsColumnResponse = z.object({
  key: z.string().describe('Column key, the same key rows use, and what sort fields address.'),
  role: z.enum(['dimension', 'measure']),
  valueType: ZInsightsValueType
});

export const ZPublicApiInsightsQueryDataResponse = z.object({
  columns: z.array(ZPublicApiInsightsColumnResponse),
  rows: z
    .array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .describe('One object per result row, keyed by column key.')
});

export const ZPublicApiInsightsQueryMeta = z.object({
  generatedAt: timestamp.describe('When the result was computed (ISO 8601).'),
  cached: z.boolean().describe('Whether the response came from the cache for this scope and spec.'),
  range: z.enum(INSIGHTS_RANGES).describe('The range actually used; the Free plan sees at most the last 7 days.')
});

export const ZPublicApiInsightsWidgetResultResponse = ZPublicApiInsightsQueryDataResponse.extend({
  total: z.number().describe('Total rows matched, across all pages.')
});

export const ZPublicApiInsightsScopeCourseResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  isGrouped: z.boolean(),
  hasPassRequired: z.boolean()
});

export const ZPublicApiInsightsScopeResponse = z.object({
  type: z.enum(INSIGHTS_SCOPE_TYPES),
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  studentCount: z.number(),
  pendingCount: z.number(),
  cohortCount: z.number(),
  activeCohortCount: z.number(),
  studentTarget: z.number().nullable(),
  courses: z.array(ZPublicApiInsightsScopeCourseResponse)
});

export const ZPublicApiInsightsSnapshotSelectionResponse = z.object({
  courseId: z.string().uuid().nullable(),
  exerciseId: z.string().uuid().nullable(),
  breakdown: z.enum(INSIGHTS_BREAKDOWN_GROUPS),
  range: z.enum(INSIGHTS_RANGES)
});

export const ZPublicApiInsightsSnapshotWidgetSpecResponse = ZPublicApiInsightsQuerySpec.safeExtend({
  minGroupRows: z.number().int().min(1).max(1000).optional()
});

export const ZPublicApiInsightsSnapshotWidgetResponse = z.object({
  id: z.string(),
  viz: z.enum(INSIGHTS_VIZ_TYPES),
  description: z.string(),
  spec: ZPublicApiInsightsSnapshotWidgetSpecResponse,
  result: ZPublicApiInsightsWidgetResultResponse.nullable(),
  errorCode: z
    .string()
    .nullable()
    .describe('Set when this widget could not be computed; the other widgets still carry their result.')
});

export const ZPublicApiInsightsSnapshotResponse = z.object({
  scope: ZPublicApiInsightsScopeResponse,
  selection: ZPublicApiInsightsSnapshotSelectionResponse,
  generatedAt: timestamp.describe('When the snapshot was assembled (ISO 8601).'),
  widgets: z.array(ZPublicApiInsightsSnapshotWidgetResponse)
});

export const ZPublicApiInsightsStudentRowResponse = z.object({
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
  status: z.enum(INSIGHTS_STATUSES).nullable(),
  nowAt: z.string().nullable().describe('Title of the item the student should do next.')
});

export const ZPublicApiRemindOverdueCohortGoalsResponse = z.object({
  enqueued: z.number().describe('Email reminders queued for overdue goal assignments.'),
  skipped: z
    .number()
    .describe(
      'Overdue learners not emailed now: no email address or due date, already reminded today, or the enqueue failed.'
    ),
  truncated: z.boolean().describe('True when the reminder run hit its page budget with assignments still unread.')
});
