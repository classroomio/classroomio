import * as z from 'zod';

export const ZMarketingRange = z.object({
  orgId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(365).default(30)
});

export const ZMarketingCourseFunnel = z.object({
  orgId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  courseId: z.string().uuid().optional()
});

export type TMarketingRange = z.infer<typeof ZMarketingRange>;
export type TMarketingCourseFunnel = z.infer<typeof ZMarketingCourseFunnel>;
