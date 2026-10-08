import * as z from 'zod';

export const PUBLIC_API_ORG_ANALYTICS_SECTIONS = [
  'overview',
  'traffic',
  'countries',
  'funnel',
  'courseTypes',
  'topCourses',
  'loginActivity',
  'compliance'
] as const;
export type TPublicApiOrgAnalyticsSection = (typeof PUBLIC_API_ORG_ANALYTICS_SECTIONS)[number];

export const PUBLIC_API_COURSE_ANALYTICS_SECTIONS = ['summary', 'funnel'] as const;
export type TPublicApiCourseAnalyticsSection = (typeof PUBLIC_API_COURSE_ANALYTICS_SECTIONS)[number];

export const PUBLIC_API_ANALYTICS_DAYS = [7, 30, 90, 365] as const;

// `include` arrives as `a,b` in a query string and as an array from MCP tools.
const toList = (value: unknown) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

const includeOf = <T extends readonly [string, ...string[]]>(sections: T, fallback: T[number]) =>
  z
    .preprocess(toList, z.array(z.enum(sections)).min(1))
    .default([fallback])
    .describe(`Comma-separated sections to return: ${sections.join(', ')}. Default: ${fallback}.`);

const ZAnalyticsDays = z.coerce
  .number()
  .pipe(z.literal(PUBLIC_API_ANALYTICS_DAYS, { error: 'days must be one of 7, 30, 90, 365' }))
  .default(30)
  .describe('Window in days, counted back from today (UTC): 7, 30, 90 or 365. Default: 30.');

export const ZPublicApiOrgAnalyticsQuery = z.object({
  include: includeOf(PUBLIC_API_ORG_ANALYTICS_SECTIONS, 'overview'),
  days: ZAnalyticsDays,
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Max rows in list sections (overview lists, topCourses, countries). 1-20, default 5.')
});
export type TPublicApiOrgAnalyticsQuery = z.infer<typeof ZPublicApiOrgAnalyticsQuery>;

export const ZPublicApiCourseAnalyticsQuery = z.object({
  include: includeOf(PUBLIC_API_COURSE_ANALYTICS_SECTIONS, 'summary'),
  days: ZAnalyticsDays
});
export type TPublicApiCourseAnalyticsQuery = z.infer<typeof ZPublicApiCourseAnalyticsQuery>;

// Each student row costs two queries, so the page is capped lower than other lists.
export const ZPublicApiCourseAnalyticsStudentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
export type TPublicApiCourseAnalyticsStudentsQuery = z.infer<typeof ZPublicApiCourseAnalyticsStudentsQuery>;

export const ZPublicApiLearnerAnalyticsParam = z.object({
  profileId: z.string().uuid()
});
export type TPublicApiLearnerAnalyticsParam = z.infer<typeof ZPublicApiLearnerAnalyticsParam>;
