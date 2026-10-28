import { describe, expect, it } from 'vitest';
import {
  bucketDailySeries,
  DATE_TICK_MIN_WIDTH,
  formatChartTooltipDate,
  getBucketSize,
  visibleTicks
} from './chart-buckets';

describe('bucketDailySeries', () => {
  const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].map((date, index) => ({
    date,
    value: index + 1
  }));

  it('sums daily values in buckets', () => {
    expect(bucketDailySeries(days, ['value'], 2, 'sum').map((bucket) => bucket.value)).toEqual([3, 7, 5]);
  });

  it('sums daily [3, 5, 2, 4] into [8, 6]', () => {
    const points = [
      { date: '2026-10-01', value: 3 },
      { date: '2026-10-02', value: 5 },
      { date: '2026-10-03', value: 2 },
      { date: '2026-10-04', value: 4 }
    ];
    expect(bucketDailySeries(points, ['value'], 2, 'sum').map((bucket) => bucket.value)).toEqual([8, 6]);
  });

  it('marks single-day and multi-day buckets', () => {
    const buckets = bucketDailySeries(days, ['value'], 2, 'sum');

    expect(buckets.map((bucket) => [bucket.isSingleDay, bucket.rawCount])).toEqual([
      [false, 2],
      [false, 2],
      [true, 1]
    ]);
  });
});

describe('getBucketSize', () => {
  it('returns 1 for 7 days regardless of width', () => {
    expect(getBucketSize(7, 1200)).toBe(1);
    expect(getBucketSize(7, 600)).toBe(1);
    expect(getBucketSize(7, 320)).toBe(1);
  });

  it('adjusts bucket size for 30 days based on width', () => {
    expect(getBucketSize(30, 900)).toBe(2);
    expect(getBucketSize(30, 600)).toBe(3);
    expect(getBucketSize(30, 400)).toBe(4);
  });

  it('adjusts bucket size for 90 days based on width', () => {
    expect(getBucketSize(90, 1200)).toBe(4);
    expect(getBucketSize(90, 800)).toBe(4);
    expect(getBucketSize(90, 500)).toBe(5);
    expect(getBucketSize(90, 350)).toBe(14);
  });
});

describe('visibleTicks', () => {
  const values = Array.from({ length: 23 }, (_, index) => index);

  it('keeps every label when they fit', () => {
    expect(visibleTicks(values.slice(0, 5), 800)).toEqual([0, 1, 2, 3, 4]);
  });

  it('thins to every n-th label so each gets its width', () => {
    const ticks = visibleTicks(values, 560);

    expect(ticks.length).toBeLessThanOrEqual(Math.floor(560 / DATE_TICK_MIN_WIDTH));
    expect(ticks[0]).toBe(0);
    expect(ticks[1] - ticks[0]).toBe(3);
  });

  it('keeps all labels before the chart is measured', () => {
    expect(visibleTicks(values, 0)).toHaveLength(23);
  });
});

describe('formatChartTooltipDate', () => {
  it('formats single day date', () => {
    const date = new Date(2026, 8, 15);
    expect(formatChartTooltipDate(date)).toContain('Sep 15, 2026');
  });

  it('formats range across same month', () => {
    const start = new Date(2026, 8, 1);
    const end = new Date(2026, 8, 5);
    const point = {
      date: start,
      endDate: end,
      isSingleDay: false,
      rawCount: 5
    };
    expect(formatChartTooltipDate(start, point)).toBe('Sep 1 – 5, 2026');
  });

  it('formats range across different months', () => {
    const start = new Date(2026, 8, 28);
    const end = new Date(2026, 9, 2);
    const point = {
      date: start,
      endDate: end,
      isSingleDay: false,
      rawCount: 5
    };
    expect(formatChartTooltipDate(start, point)).toBe('Sep 28 – Oct 2, 2026');
  });
});
