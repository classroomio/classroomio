import {
  CHART_MAX_POINTS,
  CHART_MIN_POINTS,
  CHART_VALUE_MAX,
  type TChartBlockData,
  type TChartType
} from '@cio/utils/validation/block';

export interface ChartExampleCopy {
  title: string;
  labels: string[];
}

const EXAMPLE_VALUES = [30, 55, 40, 70];

export function createPointId(): string {
  return crypto.randomUUID();
}

/**
 * The bar chart a menu click inserts, one point per example label.
 */
export function createExampleChart(copy: ChartExampleCopy): TChartBlockData {
  const points = copy.labels.map((label, index) => ({
    id: createPointId(),
    label,
    value: EXAMPLE_VALUES[index % EXAMPLE_VALUES.length]
  }));

  return { title: copy.title, type: 'bar', points };
}

export function setChartTitle(data: TChartBlockData, title: string): TChartBlockData {
  return { ...data, title };
}

export function setChartType(data: TChartBlockData, type: TChartType): TChartBlockData {
  return { ...data, type };
}

export function setPointLabel(data: TChartBlockData, pointId: string, label: string): TChartBlockData {
  const points = data.points.map((point) => (point.id === pointId ? { ...point, label } : point));

  return { ...data, points };
}

/**
 * Stores a typed value. Negative or non-numeric input counts as 0.
 */
export function setPointValue(data: TChartBlockData, pointId: string, value: number): TChartBlockData {
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), CHART_VALUE_MAX) : 0;
  const points = data.points.map((point) => (point.id === pointId ? { ...point, value: safeValue } : point));

  return { ...data, points };
}

/**
 * Appends a point with value 0. The chart is returned unchanged once it holds the maximum.
 */
export function addPoint(data: TChartBlockData, label: string): TChartBlockData {
  if (data.points.length >= CHART_MAX_POINTS) return data;

  const point = { id: createPointId(), label, value: 0 };

  return { ...data, points: [...data.points, point] };
}

/**
 * Removes one point. The chart is returned unchanged when it is already at the minimum.
 */
export function removePoint(data: TChartBlockData, pointId: string): TChartBlockData {
  if (data.points.length <= CHART_MIN_POINTS) return data;

  const points = data.points.filter((point) => point.id !== pointId);

  return { ...data, points };
}
