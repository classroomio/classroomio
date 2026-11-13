import * as z from 'zod';

import { PUBLIC_API_MARKETING_SECTIONS } from './marketing';
import { ZPublicApiGeneratedAtMeta } from './section-query';

// Response shapes for OpenAPI docs only; handlers don't validate against them.

export const ZPublicApiMarketingTrafficResponse = z.object({
  totals: z.object({
    landingViews: z.number(),
    coursePageViews: z.number(),
    uniqueVisitors: z.number(),
    enrollments: z.number(),
    completions: z.number()
  }),
  sparkline: z
    .array(z.object({ date: z.string().describe('YYYY-MM-DD'), views: z.number(), enrollments: z.number() }))
    .describe('One entry per rolled-up day, oldest first; days with no rollup row are omitted')
});

export const ZPublicApiMarketingCountryResponse = z.object({
  country: z.string().describe('ISO 3166-1 alpha-2 code'),
  views: z.number(),
  enrollments: z.number()
});

export const ZPublicApiMarketingFunnelResponse = z.object({
  steps: z.array(
    z.object({
      name: z.enum(['landing_view', 'course_page_view', 'enrollment_completed', 'course_completed']),
      count: z.number(),
      conversionFromPrev: z.number().nullable().describe('Ratio (0-1) to the previous step; null for the first step')
    })
  )
});

export const ZPublicApiMarketingCourseTypeResponse = z.object({
  type: z.string(),
  enrollments: z.number(),
  views: z.number(),
  completions: z.number(),
  courseCount: z.number()
});

export const ZPublicApiMarketingTopCourseResponse = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  views: z.number()
});

export const ZPublicApiMarketingResponse = z
  .object({
    traffic: ZPublicApiMarketingTrafficResponse.optional(),
    countries: z.array(ZPublicApiMarketingCountryResponse).optional(),
    funnel: ZPublicApiMarketingFunnelResponse.optional(),
    courseTypes: z.array(ZPublicApiMarketingCourseTypeResponse).optional(),
    topCourses: z.array(ZPublicApiMarketingTopCourseResponse).optional()
  })
  .describe('Only the requested sections are present');

export const ZPublicApiMarketingMeta = ZPublicApiGeneratedAtMeta.extend({
  include: z.array(z.enum(PUBLIC_API_MARKETING_SECTIONS)),
  days: z.number(),
  limit: z.number()
});

export const ZPublicApiCourseMarketingMeta = ZPublicApiGeneratedAtMeta.extend({
  days: z.number()
});
