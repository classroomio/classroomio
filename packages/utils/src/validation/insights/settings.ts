import * as z from 'zod';

import { INSIGHTS_LIMITS } from '../../constants/insights';

export const ZUpdateInsightsSettings = z.object({
  studentTarget: z.number().int().min(1).max(INSIGHTS_LIMITS.studentTargetMax).nullable()
});

export type TUpdateInsightsSettings = z.infer<typeof ZUpdateInsightsSettings>;
