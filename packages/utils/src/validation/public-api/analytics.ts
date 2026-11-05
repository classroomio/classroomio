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
    .describe(`Sections to return, comma-separated: ${sections.join(', ')}. Default: ${fallback}.`);

/** What each section returns; the docs list these on the endpoint page and MCP tools add them to `include`. */
export const PUBLIC_API_ORG_ANALYTICS_SECTION_NOTES = [
  'overview: totals (courses, students, certificates), top courses by students, and recent certificates.',
  'traffic: landing and course page views, unique visitors, enrollments and completions, with a per-day series.',
  'countries: views and enrollments by visitor country.',
  'funnel: landing view → course page view → enrollment → completion; for one course, use GET /courses/{courseId}/analytics?include=funnel.',
  'courseTypes: views, enrollments and completions by course type.',
  'topCourses: the most viewed course pages.',
  'loginActivity: student logins by day of week (org admin only).',
  'compliance: compliance status counts, overall and per course (org admin only); list the learners with GET /analytics/compliance/learners.'
];

export const PUBLIC_API_COURSE_ANALYTICS_SECTION_NOTES = [
  'summary: totals (tutors, students, lessons, exercises) and per-student averages for progress, exercise completion and grade.',
  'funnel: course page view → enrollment → completion for this course over days.'
];

const ZAnalyticsDays = z.coerce
  .number()
  .pipe(z.literal(PUBLIC_API_ANALYTICS_DAYS, { error: 'days must be one of 7, 30, 90, 365' }))
  .default(30)
  .describe('Days counted back from today (UTC): 7, 30, 90 or 365. Default: 30.');

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
  page: z.coerce.number().int().min(1).default(1).describe('Page number, starting at 1. Default: 1.'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Items per page, 1-50. Default: 20.')
});
export type TPublicApiCourseAnalyticsStudentsQuery = z.infer<typeof ZPublicApiCourseAnalyticsStudentsQuery>;

export const ZPublicApiLearnerAnalyticsParam = z.object({
  profileId: z.string().uuid().describe('The profileId returned by the compliance and course student lists.')
});
export type TPublicApiLearnerAnalyticsParam = z.infer<typeof ZPublicApiLearnerAnalyticsParam>;
