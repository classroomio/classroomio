import { describe, expect, it } from 'vitest';
import { CHART_MAX_POINTS, CHART_VALUE_MAX, ZChartBlockData } from '@cio/utils/validation/block';
import {
  addPoint,
  createExampleChart,
  removePoint,
  setChartTitle,
  setChartType,
  setPointLabel,
  setPointValue
} from './chart-utils';

const EXAMPLE = { title: 'Quarterly revenue', labels: ['Q1', 'Q2', 'Q3', 'Q4'] };

describe('chart utils', () => {
  it('creates a valid example bar chart with one point per label', () => {
    const chart = createExampleChart(EXAMPLE);

    expect(chart.type).toBe('bar');
    expect(chart.points.map((point) => [point.label, point.value])).toEqual([
      ['Q1', 30],
      ['Q2', 55],
      ['Q3', 40],
      ['Q4', 70]
    ]);
    expect(ZChartBlockData.safeParse(chart).success).toBe(true);
  });

  it('keeps the data when the title or type changes', () => {
    const chart = createExampleChart(EXAMPLE);
    const renamed = setChartType(setChartTitle(chart, 'Sales'), 'donut');

    expect(renamed.title).toBe('Sales');
    expect(renamed.type).toBe('donut');
    expect(renamed.points).toEqual(chart.points);
  });

  it('edits only the targeted point', () => {
    const chart = createExampleChart(EXAMPLE);
    const [first, second] = chart.points;
    const edited = setPointValue(setPointLabel(chart, first.id, 'Jan'), first.id, 12.5);

    expect(edited.points[0]).toEqual({ id: first.id, label: 'Jan', value: 12.5 });
    expect(edited.points[1]).toEqual(second);
  });

  it('treats negative and non-numeric values as 0 and caps huge ones', () => {
    const chart = createExampleChart(EXAMPLE);
    const pointId = chart.points[0].id;

    expect(setPointValue(chart, pointId, -5).points[0].value).toBe(0);
    expect(setPointValue(chart, pointId, Number.NaN).points[0].value).toBe(0);
    expect(setPointValue(chart, pointId, CHART_VALUE_MAX * 2).points[0].value).toBe(CHART_VALUE_MAX);
  });

  it('adds a zero point with the given label and stops at the maximum', () => {
    const chart = addPoint(createExampleChart(EXAMPLE), 'New');
    const added = chart.points[chart.points.length - 1];

    expect(added).toMatchObject({ label: 'New', value: 0 });

    let full = chart;
    while (full.points.length < CHART_MAX_POINTS) full = addPoint(full, 'New');

    expect(addPoint(full, 'New')).toBe(full);
  });

  it('removes a point but never the last one', () => {
    const chart = createExampleChart({ title: 'One', labels: ['Only'] });
    const twoPoints = addPoint(chart, 'New');

    expect(removePoint(twoPoints, twoPoints.points[0].id).points.map((point) => point.label)).toEqual(['New']);
    expect(removePoint(chart, chart.points[0].id)).toBe(chart);
  });
});
