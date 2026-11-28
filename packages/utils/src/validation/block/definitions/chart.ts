import * as z from 'zod';

import { defineBlock, ZBlockItemId } from '../definition';

export const CHART_TYPES = ['bar', 'line', 'pie', 'donut'] as const;
export const CHART_MIN_POINTS = 1;
export const CHART_MAX_POINTS = 12;
export const CHART_TITLE_MAX_LENGTH = 200;
export const CHART_LABEL_MAX_LENGTH = 60;
export const CHART_VALUE_MAX = 1_000_000_000;

export const ZChartType = z.enum(CHART_TYPES);
export type TChartType = z.infer<typeof ZChartType>;

export const ZChartPoint = z.object({
  id: ZBlockItemId,
  label: z.string().max(CHART_LABEL_MAX_LENGTH),
  value: z.number().min(0).max(CHART_VALUE_MAX)
});
export type TChartPoint = z.infer<typeof ZChartPoint>;

export const ZChartBlockData = z
  .object({
    title: z.string().max(CHART_TITLE_MAX_LENGTH),
    type: ZChartType,
    points: z.array(ZChartPoint).min(CHART_MIN_POINTS).max(CHART_MAX_POINTS)
  })
  .refine((data) => new Set(data.points.map((point) => point.id)).size === data.points.length, {
    message: 'Data point ids must be unique',
    path: ['points']
  });
export type TChartBlockData = z.infer<typeof ZChartBlockData>;

export const chartBlock = defineBlock({
  key: 'chart',
  dataSchema: ZChartBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: [],
  agent: {
    purpose: 'A bar, line, pie or donut chart of up to 12 labelled values, such as survey results or a budget split.',
    inputSchema: ZChartBlockData,
    toInput: (data) => data,
    fromInput: (input) => input
  }
});
