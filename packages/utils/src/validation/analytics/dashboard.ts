import * as z from 'zod';

import {
  ANALYTICS_BREAKDOWN_GROUPS,
  ANALYTICS_VIZ_TYPES,
  ANALYTICS_WIDGET_REQUIREMENTS
} from '../../constants/analytics';
import { ZAnalyticsQuerySpec } from './spec';

export const ZAnalyticsWidget = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1).optional(),
  viz: z.enum(ANALYTICS_VIZ_TYPES),
  span: z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(12)]),
  courseMode: z.enum(['all', 'single', 'any']).default('any'),
  requires: z.array(z.enum(ANALYTICS_WIDGET_REQUIREMENTS)).default([]),
  breakdown: z.enum(ANALYTICS_BREAKDOWN_GROUPS).default('core'),
  hidden: z.boolean().default(false),
  usesRange: z.boolean().default(false),
  pageGroup: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  spec: ZAnalyticsQuerySpec
});

export type TAnalyticsWidget = z.infer<typeof ZAnalyticsWidget>;
export type TAnalyticsWidgetInput = z.input<typeof ZAnalyticsWidget>;
