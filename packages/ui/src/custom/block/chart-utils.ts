import type { ChartBlockPoint, ChartBlockType } from './types';

export const CHART_TYPES: ChartBlockType[] = ['bar', 'line', 'pie', 'donut'];

export const CHART_COLORS = [
  'var(--primary)',
  'oklch(0.68 0.16 295)',
  'oklch(0.72 0.13 195)',
  'oklch(0.8 0.15 85)',
  'oklch(0.7 0.17 20)',
  'oklch(0.74 0.15 150)'
];

const AXIS_TICKS = 4;

export interface ChartScale {
  top: number;
  ticks: number[];
}

export interface ChartSlice {
  index: number;
  path: string;
}

export interface ChartPeak {
  label: string;
  value: number;
}

export function isRadialChart(type: ChartBlockType): boolean {
  return type === 'pie' || type === 'donut';
}

export function chartColor(type: ChartBlockType, index: number): string {
  return isRadialChart(type) ? CHART_COLORS[index % CHART_COLORS.length] : 'var(--primary)';
}

export function formatChartValue(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function chartTotal(points: ChartBlockPoint[]): number {
  return points.reduce((sum, point) => sum + point.value, 0);
}

/**
 * The first point with the highest value, or null when every value is 0.
 */
export function chartPeak(points: ChartBlockPoint[]): ChartPeak | null {
  const peak = points.reduce<ChartBlockPoint | null>(
    (best, point) => (best === null || point.value > best.value ? point : best),
    null
  );
  if (!peak || peak.value <= 0) return null;

  return { label: peak.label, value: peak.value };
}

/**
 * A 0-based axis with four even steps of a round size (1, 2, 2.5 or 5 times a power of ten).
 */
export function chartScale(values: number[]): ChartScale {
  const max = Math.max(...values, 0);
  const step = max > 0 ? roundStep(max / AXIS_TICKS) : 1;
  const ticks = Array.from({ length: AXIS_TICKS + 1 }, (_, index) => step * index);

  return { top: step * AXIS_TICKS, ticks };
}

function roundStep(raw: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const fraction = raw / magnitude;
  const roundFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;

  return roundFraction * magnitude;
}

/**
 * Point positions in a 100×100 box, each centred in its column, y measured from the top.
 */
export function linePoints(values: number[], top: number): { x: number; y: number }[] {
  return values.map((value, index) => ({ x: ((index + 0.5) / values.length) * 100, y: 100 - (value / top) * 100 }));
}

/**
 * A smooth path through the points, plus the same path closed along the bottom for the fill.
 */
export function linePaths(points: { x: number; y: number }[]): { line: string; area: string } {
  const [first] = points;
  const last = points[points.length - 1];
  let line = `M ${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    line += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }

  return { line, area: `${line} L ${last.x} 100 L ${first.x} 100 Z` };
}

const CENTER = 50;
const OUTER_RADIUS = 46;
const DONUT_INNER_RADIUS = 28;

function polar(radius: number, angle: number) {
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

/**
 * Slice paths in a 100×100 box, clockwise from 12 o'clock. Zero values get no slice.
 */
export function radialSlices(values: number[], donut: boolean): ChartSlice[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  const inner = donut ? DONUT_INNER_RADIUS : 0;
  const slices: ChartSlice[] = [];
  let angle = -Math.PI / 2;

  values.forEach((value, index) => {
    if (value <= 0) return;

    const sweep = Math.min((value / total) * Math.PI * 2, Math.PI * 2 - 0.0005);
    const end = angle + sweep;
    const outerStart = polar(OUTER_RADIUS, angle);
    const outerEnd = polar(OUTER_RADIUS, end);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const outerArc = `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`;

    if (donut) {
      const innerEnd = polar(inner, end);
      const innerStart = polar(inner, angle);
      const innerArc = `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`;
      slices.push({
        index,
        path: `M ${outerStart.x} ${outerStart.y} ${outerArc} L ${innerEnd.x} ${innerEnd.y} ${innerArc} Z`
      });
    } else {
      slices.push({ index, path: `M ${CENTER} ${CENTER} L ${outerStart.x} ${outerStart.y} ${outerArc} Z` });
    }

    angle = end;
  });

  return slices;
}

/**
 * The ring drawn when every value is 0.
 */
export function emptyRing(donut: boolean): { radius: number; width: number } {
  return donut
    ? { radius: (OUTER_RADIUS + DONUT_INNER_RADIUS) / 2, width: OUTER_RADIUS - DONUT_INNER_RADIUS }
    : { radius: OUTER_RADIUS / 2, width: OUTER_RADIUS };
}

export function chartPercent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
