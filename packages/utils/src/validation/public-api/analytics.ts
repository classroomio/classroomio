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
  ANALYTICS_SOURCES,
  ANALYTICS_STATUSES
} from '../../constants/analytics';
import { ZPublicApiPaginationQuery } from './pagination';

/**
 * The breakdown choices a snapshot caller may pick. `core` is the dashboard default the snapshot resolves itself,
 * so the public API stops at the explicit splits.
 */
export const PUBLIC_API_ANALYTICS_BREAKDOWN_GROUPS = ['courses', 'cohorts'] as const;
export type TPublicApiAnalyticsBreakdownGroup = (typeof PUBLIC_API_ANALYTICS_BREAKDOWN_GROUPS)[number];
export const PUBLIC_API_ANALYTICS_STUDENT_SORTS = ['status', 'name', 'progress', 'score', 'lastLogin'] as const;
export type TPublicApiAnalyticsStudentSort = (typeof PUBLIC_API_ANALYTICS_STUDENT_SORTS)[number];

export const ZPublicApiAnalyticsScope = z.object({
  type: z.enum(ANALYTICS_SCOPE_TYPES).describe("'cohort', 'course' or 'org', the analytics scope to read."),
  id: z.string().uuid().describe('The scope id inside the key organization.')
});
export type TPublicApiAnalyticsScope = z.infer<typeof ZPublicApiAnalyticsScope>;

function filterHasValue(filter: { op: (typeof ANALYTICS_FILTER_OPS)[number]; value?: unknown }): boolean {
  if (filter.op === 'is_true' || filter.op === 'is_false') return filter.value === undefined;

  if (filter.op === 'in') return Array.isArray(filter.value);

  return filter.value !== undefined && !Array.isArray(filter.value);
}

export const ZPublicApiAnalyticsFilter = z
  .object({
    field: z
      .enum(ANALYTICS_FILTER_FIELDS)
      .describe('A filter field from the catalog for this source, with its ops and value type.'),
    op: z
      .enum(ANALYTICS_FILTER_OPS)
      .describe(
        "'eq' matches an id or status, 'in' matches ids, 'gte' and 'lt' bound numbers, 'is_true' and 'is_false' take no value."
      ),
    value: z
      .union([
        z
          .string()
          .min(1)
          .max(64)
          .refine((value) => !value.startsWith('$'), {
            message: 'Filter values starting with $ are dashboard placeholders and are rejected'
          }),
        z.number().finite(),
        z
          .string()
          .uuid()
          .array()
          .min(1)
          .max(ANALYTICS_LIMITS.maxFilterValues)
          .describe('For in: 1 to 100 course, cohort, student or exercise ids.')
      ])
      .optional()
      .describe(
        'One exact string or number for eq, gte and lt; a string starting with $ is a dashboard placeholder and is rejected. For in, an array of 1 to 100 ids.'
      )
  })
  .refine(filterHasValue, { path: ['value'] });
export type TPublicApiAnalyticsFilter = z.infer<typeof ZPublicApiAnalyticsFilter>;

export const ZPublicApiAnalyticsMeasure = z.object({
  metric: z.enum(ANALYTICS_METRICS).describe('A metric id from the catalog for this source, with its value type.'),
  agg: z
    .enum(ANALYTICS_AGGS)
    .describe('An aggregation the catalog allows for this metric, such as value, count, avg or rate.')
});
export type TPublicApiAnalyticsMeasure = z.infer<typeof ZPublicApiAnalyticsMeasure>;

export const ZPublicApiAnalyticsSort = z.object({
  field: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(64)
    .describe('A dimension id or measure column key from the first response, such as student or rows__count.'),
  dir: z.enum(['asc', 'desc']).default('asc').describe("Sort direction, 'asc' or 'desc'. Default: 'asc'.")
});
export type TPublicApiAnalyticsSort = z.infer<typeof ZPublicApiAnalyticsSort>;

export const ZPublicApiAnalyticsQuerySpec = z
  .object({
    source: z
      .enum(ANALYTICS_SOURCES)
      .describe('A source id from the catalog, which also lists the scope types it supports.'),
    measures: z
      .array(ZPublicApiAnalyticsMeasure)
      .min(1)
      .max(ANALYTICS_LIMITS.maxMeasures)
      .describe(`1 to ${ANALYTICS_LIMITS.maxMeasures} metric and aggregation pairs from the catalog.`),
    dimensions: z
      .array(z.enum(ANALYTICS_DIMENSIONS))
      .max(2)
      .default([])
      .describe('Up to 2 dimension ids the catalog supports for this source.'),
    filters: z
      .array(ZPublicApiAnalyticsFilter)
      .max(10)
      .default([])
      .describe('Up to 10 filters from the catalog, each with the value shape its op allows.'),
    sort: z
      .array(ZPublicApiAnalyticsSort)
      .max(3)
      .default([])
      .describe('Up to 3 sort keys, applied in order: a dimension id or a measure column key.'),
    minGroupRows: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe('Drop groups with fewer rows; paging a snapshot widget spec needs its cutoff to keep the same groups.'),
    search: z
      .string()
      .trim()
      .max(ANALYTICS_LIMITS.maxSearchLength)
      .optional()
      .describe('Free-text search of at most 100 characters, only honored when the catalog says the source hasSearch.'),
    days: z
      .number()
      .int()
      .refine((days) => (ANALYTICS_LOGIN_WINDOWS as readonly number[]).includes(days))
      .optional()
      .describe('Login window for the login_day source, in days: 7, 14 or 30.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(ANALYTICS_LIMITS.maxRows)
      .default(ANALYTICS_LIMITS.pageSize)
      .describe(`Rows per page, 1-${ANALYTICS_LIMITS.maxRows}. Default: ${ANALYTICS_LIMITS.pageSize}.`),
    page: z
      .number()
      .int()
      .min(1)
      .max(ANALYTICS_LIMITS.maxPage)
      .default(1)
      .describe(
        `Page number, starting at 1, at most ${ANALYTICS_LIMITS.maxPage}. Page and limit together address at most the first ${ANALYTICS_LIMITS.maxOffset} rows.`
      ),
    range: z
      .enum(ANALYTICS_RANGES)
      .default('all')
      .describe(
        "'all', '7d', '30d' or '90d'; meta.range reports what was used. The Free plan reads at most the last 7 days."
      )
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
export type TPublicApiAnalyticsQuerySpec = z.infer<typeof ZPublicApiAnalyticsQuerySpec>;

export const ZPublicApiAnalyticsQueryRequest = z.object({
  scope: ZPublicApiAnalyticsScope,
  spec: ZPublicApiAnalyticsQuerySpec
});
export type TPublicApiAnalyticsQueryRequest = z.infer<typeof ZPublicApiAnalyticsQueryRequest>;

export const ZPublicApiAnalyticsSnapshotQuery = z.object({
  courseId: z
    .string()
    .uuid()
    .optional()
    .describe(
      'Course the per-course widgets focus on; organization and cohort snapshots leave per-course widgets out unless you pass it. A course outside the scope fails with 404.'
    ),
  exerciseId: z
    .string()
    .uuid()
    .optional()
    .describe(
      'Per-exercise widgets focus on this exercise; defaults to the last pass-required exercise. Outside the selected course it fails with 404.'
    ),
  range: z
    .enum(ANALYTICS_RANGES)
    .optional()
    .describe("Data range for every widget: 'all', '7d', '30d' or '90d'. Default: 'all'."),
  breakdown: z
    .enum(PUBLIC_API_ANALYTICS_BREAKDOWN_GROUPS)
    .optional()
    .describe(
      "Course or org scope: how split widgets break the scope down, 'courses' or 'cohorts'. Cohort scope ignores it. Defaults to the split the dashboard picks."
    )
});
export type TPublicApiAnalyticsSnapshotQuery = z.infer<typeof ZPublicApiAnalyticsSnapshotQuery>;

export const ZPublicApiCourseAnalyticsSnapshotQuery = ZPublicApiAnalyticsSnapshotQuery.omit({ courseId: true });
export type TPublicApiCourseAnalyticsSnapshotQuery = z.infer<typeof ZPublicApiCourseAnalyticsSnapshotQuery>;

const analyticsStudentsQueryBase = ZPublicApiPaginationQuery.extend({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(ANALYTICS_LIMITS.maxPage)
    .default(1)
    .describe(`Page number, starting at 1, at most ${ANALYTICS_LIMITS.maxPage}.`),
  courseId: z.string().uuid().optional().describe('Limit the table to one course inside the scope.'),
  search: z
    .string()
    .trim()
    .max(ANALYTICS_LIMITS.maxSearchLength)
    .optional()
    .describe('Match the student name or email, at most 100 characters.'),
  status: z.enum(ANALYTICS_STATUSES).optional().describe("'at_risk', 'lagging', 'on_track' or 'completed'."),
  isOverdue: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => (value == null ? undefined : value === true || value === 'true'))
    .describe('true lists only students with an overdue item, false only those without; omit to list both.'),
  sort: z
    .enum(PUBLIC_API_ANALYTICS_STUDENT_SORTS)
    .default('status')
    .describe("'status', 'name', 'progress', 'score' or 'lastLogin'. Default: 'status'."),
  dir: z
    .enum(['asc', 'desc'])
    .optional()
    .describe(
      'Sort direction; without it at-risk comes first for status, lowest progress or score first, names A–Z, newest login first.'
    )
});

function assertStudentsPageWithinOffset(query: { page: number; limit: number }, context: z.core.$RefinementCtx): void {
  if ((query.page - 1) * query.limit > ANALYTICS_LIMITS.maxOffset) {
    context.addIssue({
      code: 'custom',
      message: `page and limit exceed the ${ANALYTICS_LIMITS.maxOffset} row offset limit`,
      path: ['page']
    });
  }
}

export const ZPublicApiAnalyticsStudentsQuery = analyticsStudentsQueryBase.superRefine(assertStudentsPageWithinOffset);
export type TPublicApiAnalyticsStudentsQuery = z.infer<typeof ZPublicApiAnalyticsStudentsQuery>;

export const ZPublicApiCourseAnalyticsStudentsQuery = analyticsStudentsQueryBase
  .omit({ courseId: true })
  .superRefine(assertStudentsPageWithinOffset);
export type TPublicApiCourseAnalyticsStudentsQuery = z.infer<typeof ZPublicApiCourseAnalyticsStudentsQuery>;
