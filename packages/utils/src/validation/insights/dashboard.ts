import * as z from 'zod';

import { INSIGHTS_BREAKDOWN_GROUPS, INSIGHTS_VIZ_TYPES, INSIGHTS_WIDGET_REQUIREMENTS } from '../../constants/insights';
import { ZInsightsQuerySpec } from './spec';

export const ZInsightsWidget = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1).optional(),
  viz: z.enum(INSIGHTS_VIZ_TYPES),
  span: z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(12)]),
  courseMode: z.enum(['all', 'single', 'any']).default('any'),
  requires: z.array(z.enum(INSIGHTS_WIDGET_REQUIREMENTS)).default([]),
  breakdown: z.enum(INSIGHTS_BREAKDOWN_GROUPS).default('core'),
  hidden: z.boolean().default(false),
  usesRange: z.boolean().default(false),
  pageGroup: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  spec: ZInsightsQuerySpec
});

export type TInsightsWidget = z.infer<typeof ZInsightsWidget>;
export type TInsightsWidgetInput = z.input<typeof ZInsightsWidget>;
