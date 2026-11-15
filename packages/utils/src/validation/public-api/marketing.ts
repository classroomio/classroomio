import * as z from 'zod';

import { ZPublicApiAnalyticsDays, includeOf } from './section-query';

export const PUBLIC_API_MARKETING_SECTIONS = ['traffic', 'countries', 'funnel', 'courseTypes', 'topCourses'] as const;
export type TPublicApiMarketingSection = (typeof PUBLIC_API_MARKETING_SECTIONS)[number];

/** What each section returns; the docs list these on the endpoint page and MCP tools add them to `include`. */
export const PUBLIC_API_MARKETING_SECTION_NOTES = [
  'traffic: landing and course page views, unique visitors, enrollments and completions, with a per-day series.',
  'countries: views and enrollments by visitor country.',
  'funnel: landing view → course page view → enrollment → completion; for one course, use GET /analytics/marketing/courses/{courseId}.',
  'courseTypes: views, enrollments and completions by course type.',
  'topCourses: the most viewed course pages.'
];

export const ZPublicApiMarketingQuery = z.object({
  include: includeOf(PUBLIC_API_MARKETING_SECTIONS, 'traffic'),
  days: ZPublicApiAnalyticsDays,
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Max rows in list sections (topCourses, countries). 1-20, default 5.')
});
export type TPublicApiMarketingQuery = z.infer<typeof ZPublicApiMarketingQuery>;

export const ZPublicApiCourseMarketingQuery = z.object({
  days: ZPublicApiAnalyticsDays
});
export type TPublicApiCourseMarketingQuery = z.infer<typeof ZPublicApiCourseMarketingQuery>;
