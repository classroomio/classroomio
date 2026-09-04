import * as z from 'zod';

const ZBustCache = z
  .enum(['0', '1'])
  .optional()
  .transform((value) => value === '1');

export const ZDashAnalyticsRange = z.object({
  orgId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  bust: ZBustCache
});

export const ZDashCourseFunnel = z.object({
  orgId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  courseId: z.string().uuid().optional(),
  bust: ZBustCache
});

export const ZDashComplianceOverview = z.object({
  orgId: z.string().uuid()
});

export type TDashAnalyticsRange = z.infer<typeof ZDashAnalyticsRange>;
export type TDashCourseFunnel = z.infer<typeof ZDashCourseFunnel>;
export type TDashComplianceOverview = z.infer<typeof ZDashComplianceOverview>;
