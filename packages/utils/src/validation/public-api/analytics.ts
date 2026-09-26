import * as z from 'zod';

export const ZPublicApiAnalyticsRangeQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30)
});
export type TPublicApiAnalyticsRangeQuery = z.infer<typeof ZPublicApiAnalyticsRangeQuery>;

export const ZPublicApiAnalyticsFunnelQuery = ZPublicApiAnalyticsRangeQuery.extend({
  courseId: z.string().uuid().optional()
});
export type TPublicApiAnalyticsFunnelQuery = z.infer<typeof ZPublicApiAnalyticsFunnelQuery>;

export const ZPublicApiLoginActivityQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(90)
});
export type TPublicApiLoginActivityQuery = z.infer<typeof ZPublicApiLoginActivityQuery>;

export const ZPublicApiLearnerAnalyticsParam = z.object({
  profileId: z.string().uuid()
});
export type TPublicApiLearnerAnalyticsParam = z.infer<typeof ZPublicApiLearnerAnalyticsParam>;
