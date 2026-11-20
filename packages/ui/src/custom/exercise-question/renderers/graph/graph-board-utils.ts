import type { GraphPlotTool, GraphPoint, PlotElement } from '@cio/question-types';

export type PlotHandle = 'point' | 'from' | 'to' | 'vertex' | 'through';

export const GRAPH_COLORS = {
  student: '#2563eb',
  correct: '#16a34a',
  wrong: '#dc2626',
  expected: '#16a34a',
  pending: '#64748b',
  curves: ['#7c3aed', '#ea580c', '#0891b2', '#be185d', '#4d7c0f', '#a16207']
} as const;

/** The handles a student can drag on each element kind. */
export const PLOT_HANDLES: Record<PlotElement['kind'], PlotHandle[]> = {
  point: ['point'],
  line: ['from', 'to'],
  segment: ['from', 'to'],
  parabola: ['vertex', 'through']
};

/** Clicks a tool needs before it makes an element: one for a point, two for everything else. */
export function clicksNeeded(tool: GraphPlotTool): number {
  return tool === 'point' ? 1 : 2;
}

/** Builds the element a tool makes from its clicks, or null while it still needs more. */
export function buildPlotElement(tool: GraphPlotTool, clicks: GraphPoint[]): PlotElement | null {
  if (clicks.length < clicksNeeded(tool)) return null;

  const [first, second] = clicks;
  if (tool === 'point') return { kind: 'point', x: first.x, y: first.y };
  if (tool === 'parabola') return { kind: 'parabola', vertex: first, through: second };

  return { kind: tool, from: first, to: second };
}

export function readHandle(element: PlotElement, handle: PlotHandle): GraphPoint {
  if (element.kind === 'point') return { x: element.x, y: element.y };
  if (element.kind === 'parabola') return handle === 'vertex' ? element.vertex : element.through;

  return handle === 'from' ? element.from : element.to;
}

/** Returns the element with one handle moved to `point`. */
export function moveHandle(element: PlotElement, handle: PlotHandle, point: GraphPoint): PlotElement {
  if (element.kind === 'point') return { kind: 'point', ...point };
  if (element.kind === 'parabola') {
    return handle === 'vertex' ? { ...element, vertex: point } : { ...element, through: point };
  }

  return handle === 'from' ? { ...element, from: point } : { ...element, to: point };
}

/** Width over height of the board, kept within a range that stays usable on a phone and on a desktop. */
export function boardAspectRatio(board: { xMin: number; xMax: number; yMin: number; yMax: number }): number {
  const ratio = (board.xMax - board.xMin) / (board.yMax - board.yMin);

  return Math.min(2, Math.max(0.6, ratio));
}
