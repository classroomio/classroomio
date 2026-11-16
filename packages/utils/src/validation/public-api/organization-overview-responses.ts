import * as z from 'zod';

import { PUBLIC_API_ORGANIZATION_OVERVIEW_SECTIONS } from './organization-overview';
import { ZPublicApiGeneratedAtMeta } from './section-query';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();

export const ZPublicApiOrganizationOverviewSummaryResponse = z.object({
  totalCertificates: z.number(),
  numberOfCourses: z.number(),
  totalStudents: z.number(),
  topCourses: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        enrollments: z.number(),
        completion: z.number().describe('Percentage of enrolled students who completed the course'),
        certification: z.number().describe('Percentage of enrolled students who earned the certificate')
      })
    )
    .describe('Up to 5 courses with the most students'),
  recentCertifications: z
    .array(
      z.object({
        id: z.string().uuid().describe('Profile id of the student'),
        avatarUrl: z.string().nullable(),
        name: z.string(),
        courseId: z.string().uuid(),
        course: z.string(),
        date: timestamp
      })
    )
    .describe('Up to 5 most recent certificates')
});

export const ZPublicApiLoginActivityResponse = z.object({
  day: z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
  count: z.number()
});

export const ZPublicApiOrganizationOverviewResponse = z
  .object({
    summary: ZPublicApiOrganizationOverviewSummaryResponse.optional(),
    loginActivity: z.array(ZPublicApiLoginActivityResponse).optional()
  })
  .describe('Only the requested sections the caller may see are present');

export const ZPublicApiOrganizationOverviewMeta = ZPublicApiGeneratedAtMeta.extend({
  include: z.array(z.enum(PUBLIC_API_ORGANIZATION_OVERVIEW_SECTIONS)),
  days: z.number(),
  limit: z.number(),
  omitted: z
    .array(
      z.object({
        section: z.enum(PUBLIC_API_ORGANIZATION_OVERVIEW_SECTIONS),
        reason: z.enum(['requires_org_admin'])
      })
    )
    .describe('Requested sections left out because the key creator may not see them')
});
