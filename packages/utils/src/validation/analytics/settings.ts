import * as z from 'zod';

import { ANALYTICS_LIMITS } from '../../constants/analytics';

export const ZUpdateAnalyticsSettings = z.object({
  studentTarget: z.number().int().min(1).max(ANALYTICS_LIMITS.studentTargetMax).nullable()
});

export type TUpdateAnalyticsSettings = z.infer<typeof ZUpdateAnalyticsSettings>;
