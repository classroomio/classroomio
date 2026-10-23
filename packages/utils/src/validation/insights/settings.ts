import * as z from 'zod';

import { INSIGHTS_LIMITS } from '../../constants/insights';

export const ZUpdateInsightsSettings = z.object({
  learnerTarget: z.number().int().min(1).max(INSIGHTS_LIMITS.learnerTargetMax).nullable()
});

export type TUpdateInsightsSettings = z.infer<typeof ZUpdateInsightsSettings>;
