export const GRAPH_PLOT_TOOLS = ['point', 'line', 'segment', 'parabola'] as const;
export type GraphPlotTool = (typeof GRAPH_PLOT_TOOLS)[number];

export const GRAPH_MAX_ELEMENTS = 40;
export const GRAPH_MAX_CURVES = 6;
export const GRAPH_MAX_POINTS = 20;
export const GRAPH_MAX_COORDINATE = 10000;
export const DEFAULT_GRAPH_PLOT_TOLERANCE = 0.25;
export const DEFAULT_GRAPH_READ_TOLERANCE = 0.1;

export type GraphPoint = { x: number; y: number };

export type GraphBoardSettings = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  grid: boolean;
  /** Grid step that placed and dragged points snap to; 0 turns snapping off. */
  snap: number;
  xLabel: string;
  yLabel: string;
};

export const DEFAULT_GRAPH_BOARD: GraphBoardSettings = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  grid: true,
  snap: 1,
  xLabel: 'x',
  yLabel: 'y'
};

/** A point, a line or segment through two points, or a parabola given by its vertex and one other point on it. */
export type PlotElement =
  | ({ kind: 'point' } & GraphPoint)
  | { kind: 'line' | 'segment'; from: GraphPoint; to: GraphPoint }
  | { kind: 'parabola'; vertex: GraphPoint; through: GraphPoint };

export type GraphPlotSettings = {
  board: GraphBoardSettings;
  tools: GraphPlotTool[];
  expected: PlotElement[];
  /** How close, in graph units, a student's element must be to the expected one. */
  tolerance: number;
};

export type GraphCurve = { expression: string; label?: string };
export type GraphLabelledPoint = GraphPoint & { label?: string };

export type GraphReadKey =
  | { kind: 'value'; value: number; tolerance: number }
  | ({ kind: 'point'; tolerance: number } & GraphPoint);

export type GraphReadSettings = {
  board: GraphBoardSettings;
  curves: GraphCurve[];
  points: GraphLabelledPoint[];
  answer: GraphReadKey | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed) <= GRAPH_MAX_COORDINATE ? parsed : undefined;
}

function readNonNegative(value: unknown, fallback: number): number {
  const parsed = toFiniteNumber(value);
  return parsed !== undefined && parsed >= 0 ? parsed : fallback;
}

export function readGraphPoint(raw: unknown): GraphPoint | null {
  if (!isRecord(raw)) return null;

  const x = toFiniteNumber(raw.x);
  const y = toFiniteNumber(raw.y);
  return x === undefined || y === undefined ? null : { x, y };
}

/** Reads one plot element, returning null for an unknown kind or a missing coordinate. */
export function readPlotElement(raw: unknown): PlotElement | null {
  if (!isRecord(raw)) return null;

  if (raw.kind === 'point') {
    const point = readGraphPoint(raw);
    return point ? { kind: 'point', ...point } : null;
  }
  if (raw.kind === 'line' || raw.kind === 'segment') {
    const from = readGraphPoint(raw.from);
    const to = readGraphPoint(raw.to);
    return from && to ? { kind: raw.kind, from, to } : null;
  }
  if (raw.kind === 'parabola') {
    const vertex = readGraphPoint(raw.vertex);
    const through = readGraphPoint(raw.through);
    return vertex && through ? { kind: 'parabola', vertex, through } : null;
  }

  return null;
}

export function readPlotElements(raw: unknown): PlotElement[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(readPlotElement)
    .filter((element): element is PlotElement => element !== null)
    .slice(0, GRAPH_MAX_ELEMENTS);
}

/** Reads the board shared by both graph types; an inverted or empty range falls back to the default. */
export function readGraphBoardSettings(raw: unknown): GraphBoardSettings {
  const board = isRecord(raw) ? raw : {};
  const xMin = toFiniteNumber(board.xMin) ?? DEFAULT_GRAPH_BOARD.xMin;
  const xMax = toFiniteNumber(board.xMax) ?? DEFAULT_GRAPH_BOARD.xMax;
  const yMin = toFiniteNumber(board.yMin) ?? DEFAULT_GRAPH_BOARD.yMin;
  const yMax = toFiniteNumber(board.yMax) ?? DEFAULT_GRAPH_BOARD.yMax;
  const isXRangeValid = xMin < xMax;
  const isYRangeValid = yMin < yMax;

  return {
    xMin: isXRangeValid ? xMin : DEFAULT_GRAPH_BOARD.xMin,
    xMax: isXRangeValid ? xMax : DEFAULT_GRAPH_BOARD.xMax,
    yMin: isYRangeValid ? yMin : DEFAULT_GRAPH_BOARD.yMin,
    yMax: isYRangeValid ? yMax : DEFAULT_GRAPH_BOARD.yMax,
    grid: board.grid !== false,
    snap: readNonNegative(board.snap, DEFAULT_GRAPH_BOARD.snap),
    xLabel: typeof board.xLabel === 'string' ? board.xLabel.slice(0, 20) : DEFAULT_GRAPH_BOARD.xLabel,
    yLabel: typeof board.yLabel === 'string' ? board.yLabel.slice(0, 20) : DEFAULT_GRAPH_BOARD.yLabel
  };
}

/** Reads `GRAPH_PLOT` settings; `board` is the board config, `expected` the teacher's reference answer. */
export function readGraphPlotSettings(raw: Record<string, unknown> | null | undefined): GraphPlotSettings {
  const settings = raw ?? {};
  const requestedTools = Array.isArray(settings.tools)
    ? settings.tools.filter((tool): tool is GraphPlotTool => GRAPH_PLOT_TOOLS.includes(tool as GraphPlotTool))
    : [];

  return {
    board: readGraphBoardSettings(settings.board),
    tools:
      requestedTools.length > 0
        ? GRAPH_PLOT_TOOLS.filter((tool) => requestedTools.includes(tool))
        : [...GRAPH_PLOT_TOOLS],
    expected: readPlotElements(settings.expected),
    tolerance: readNonNegative(settings.tolerance, DEFAULT_GRAPH_PLOT_TOLERANCE)
  };
}

function readGraphReadKey(raw: unknown): GraphReadKey | null {
  if (!isRecord(raw)) return null;

  const tolerance = readNonNegative(raw.tolerance, DEFAULT_GRAPH_READ_TOLERANCE);
  if (raw.kind === 'value') {
    const value = toFiniteNumber(raw.value);
    return value === undefined ? null : { kind: 'value', value, tolerance };
  }
  if (raw.kind === 'point') {
    const point = readGraphPoint(raw);
    return point ? { kind: 'point', ...point, tolerance } : null;
  }

  return null;
}

/** Reads `GRAPH_READ` settings: the graph the student reads (`curves`, `points`) and the accepted `answer`. */
export function readGraphReadSettings(raw: Record<string, unknown> | null | undefined): GraphReadSettings {
  const settings = raw ?? {};
  const curves = Array.isArray(settings.curves)
    ? settings.curves
        .filter(isRecord)
        .map((curve) => ({
          expression: String(curve.expression ?? '').trim(),
          ...(typeof curve.label === 'string' && curve.label.trim() ? { label: curve.label.trim().slice(0, 40) } : {})
        }))
        .filter((curve) => curve.expression)
        .slice(0, GRAPH_MAX_CURVES)
    : [];
  const points = Array.isArray(settings.points)
    ? settings.points
        .map((entry) => {
          const point = readGraphPoint(entry);
          const label = isRecord(entry) && typeof entry.label === 'string' ? entry.label.trim().slice(0, 20) : '';

          return point ? { ...point, ...(label ? { label } : {}) } : null;
        })
        .filter((point): point is GraphLabelledPoint => point !== null)
        .slice(0, GRAPH_MAX_POINTS)
    : [];

  return {
    board: readGraphBoardSettings(settings.board),
    curves,
    points,
    answer: readGraphReadKey(settings.answer)
  };
}

/** Rounds `value` to the nearest multiple of `step` and keeps it inside `[min, max]`; a step of 0 only clamps. */
export function snapGraphCoordinate(value: number, step: number, min: number, max: number): number {
  const snapped = step > 0 ? Math.round(value / step) * step : value;
  const rounded = Number(snapped.toFixed(6));

  return Math.min(max, Math.max(min, rounded));
}
