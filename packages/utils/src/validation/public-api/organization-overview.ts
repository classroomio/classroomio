import * as z from 'zod';

import { ZPublicApiAnalyticsDays, includeOf } from './section-query';

export const PUBLIC_API_ORGANIZATION_OVERVIEW_SECTIONS = ['summary', 'loginActivity'] as const;
export type TPublicApiOrganizationOverviewSection = (typeof PUBLIC_API_ORGANIZATION_OVERVIEW_SECTIONS)[number];

/** What each section returns; the docs list these on the endpoint page and MCP tools add them to `include`. */
export const PUBLIC_API_ORGANIZATION_OVERVIEW_SECTION_NOTES = [
  'summary: totals (courses, students, certificates), top courses by students, and recent certificates.',
  'loginActivity: student logins by day of week (org admin only).'
];

export const ZPublicApiOrganizationOverviewQuery = z.object({
  include: includeOf(PUBLIC_API_ORGANIZATION_OVERVIEW_SECTIONS, 'summary'),
  days: ZPublicApiAnalyticsDays,
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Max rows in the summary lists (top courses and recent certificates). 1-20, default 5.')
});
export type TPublicApiOrganizationOverviewQuery = z.infer<typeof ZPublicApiOrganizationOverviewQuery>;
