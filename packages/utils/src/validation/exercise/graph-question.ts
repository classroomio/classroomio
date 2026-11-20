import * as z from 'zod';

import {
  GRAPH_MAX_COORDINATE,
  GRAPH_MAX_CURVES,
  GRAPH_MAX_ELEMENTS,
  GRAPH_MAX_POINTS,
  GRAPH_PLOT_TOOLS
} from '@cio/question-types';

const ZCoordinate = z.number().finite().min(-GRAPH_MAX_COORDINATE).max(GRAPH_MAX_COORDINATE);
const ZNonNegative = z.number().finite().min(0);
const ZGraphPoint = z.object({ x: ZCoordinate, y: ZCoordinate });

export const ZGraphBoardSettings = z
  .object({
    xMin: ZCoordinate,
    xMax: ZCoordinate,
    yMin: ZCoordinate,
    yMax: ZCoordinate,
    grid: z.boolean().optional(),
    snap: ZNonNegative.optional(),
    xLabel: z.string().max(20).optional(),
    yLabel: z.string().max(20).optional()
  })
  .refine((board) => board.xMin < board.xMax && board.yMin < board.yMax, {
    message: 'Each minimum of the graph range must be smaller than its maximum'
  });

export const ZPlotElement = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('point'), x: ZCoordinate, y: ZCoordinate }),
  z.object({ kind: z.literal('line'), from: ZGraphPoint, to: ZGraphPoint }),
  z.object({ kind: z.literal('segment'), from: ZGraphPoint, to: ZGraphPoint }),
  z.object({ kind: z.literal('parabola'), vertex: ZGraphPoint, through: ZGraphPoint })
]);

export const ZGraphPlotSettings = z.object({
  board: ZGraphBoardSettings.optional(),
  tools: z.array(z.enum(GRAPH_PLOT_TOOLS)).min(1).optional(),
  expected: z.array(ZPlotElement).min(1, 'Draw at least one element as the correct answer').max(GRAPH_MAX_ELEMENTS),
  tolerance: ZNonNegative.optional()
});
export type TGraphPlotSettings = z.infer<typeof ZGraphPlotSettings>;

export const ZGraphReadSettings = z
  .object({
    board: ZGraphBoardSettings.optional(),
    curves: z
      .array(z.object({ expression: z.string().trim().min(1).max(200), label: z.string().max(40).optional() }))
      .max(GRAPH_MAX_CURVES)
      .optional(),
    points: z
      .array(z.object({ x: ZCoordinate, y: ZCoordinate, label: z.string().max(20).optional() }))
      .max(GRAPH_MAX_POINTS)
      .optional(),
    answer: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('value'), value: ZCoordinate, tolerance: ZNonNegative.optional() }),
      z.object({ kind: z.literal('point'), x: ZCoordinate, y: ZCoordinate, tolerance: ZNonNegative.optional() })
    ])
  })
  .refine((settings) => (settings.curves?.length ?? 0) + (settings.points?.length ?? 0) > 0, {
    message: 'Add a function or a point to the graph students read'
  });
export type TGraphReadSettings = z.infer<typeof ZGraphReadSettings>;
