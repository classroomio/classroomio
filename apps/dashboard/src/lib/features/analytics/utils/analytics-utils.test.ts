import { describe, expect, it } from 'vitest';
import {
  bucketSparkline,
  formatChartTooltipDate,
  getBucketSize,
  zeroFillRange,
  type BucketedChartPoint,
  type RawSparklinePoint
} from './analytics-utils';

describe('getBucketSize', () => {
  it('returns 1 for 7 days regardless of width', () => {
    expect(getBucketSize(7, 1200)).toBe(1);
    expect(getBucketSize(7, 600)).toBe(1);
    expect(getBucketSize(7, 320)).toBe(1);
  });

  it('adjusts bucket size for 30 days based on width', () => {
    expect(getBucketSize(30, 900)).toBe(1);
    expect(getBucketSize(30, 600)).toBe(2);
    expect(getBucketSize(30, 400)).toBe(3);
  });

  it('adjusts bucket size for 90 days based on width', () => {
    expect(getBucketSize(90, 1200)).toBe(5);
    expect(getBucketSize(90, 800)).toBe(5);
    expect(getBucketSize(90, 500)).toBe(7);
    expect(getBucketSize(90, 350)).toBe(14);
  });
});

describe('bucketSparkline', () => {
  it('returns empty array when sparkline is empty or null', () => {
    expect(bucketSparkline([], 3)).toEqual([]);
    expect(bucketSparkline(null, 3)).toEqual([]);
  });

  it('zero-fills a full window, preserving real values and ordering', () => {
    const raw: RawSparklinePoint[] = [
      { date: '2026-09-01', views: 10, enrollments: 2 },
      { date: '2026-09-03', views: 30, enrollments: 6 }
    ];

    const filled = zeroFillRange(raw, 5, new Date(Date.UTC(2026, 8, 5, 12)));

    expect(filled).toHaveLength(5);
    expect(filled.map((p) => p.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    expect(filled[0]).toEqual({ date: '2026-09-01', views: 10, enrollments: 2 });
    expect(filled[1]).toEqual({ date: '2026-09-02', views: 0, enrollments: 0 });
    expect(filled[2]).toEqual({ date: '2026-09-03', views: 30, enrollments: 6 });
    expect(filled[3]).toEqual({ date: '2026-09-04', views: 0, enrollments: 0 });
    expect(filled[4]).toEqual({ date: '2026-09-05', views: 0, enrollments: 0 });
  });

  it('returns a single all-zero day when no data is provided', () => {
    const filled = zeroFillRange(null, 1, new Date(Date.UTC(2026, 8, 5, 12)));
    expect(filled).toEqual([{ date: '2026-09-05', views: 0, enrollments: 0 }]);
  });

  it('returns an empty array for a non-positive window', () => {
    expect(zeroFillRange([{ date: '2026-09-01', views: 1, enrollments: 0 }], 0)).toEqual([]);
  });

  it('returns an empty array when sparkline is empty or null', () => {
    expect(bucketSparkline([], 3)).toEqual([]);
    expect(bucketSparkline(null, 3)).toEqual([]);
  });

  it('preserves 1-day points when bucketSize is 1', () => {
    const raw: RawSparklinePoint[] = [
      { date: '2026-09-01', views: 10, enrollments: 2 },
      { date: '2026-09-02', views: 20, enrollments: 4 }
    ];

    const bucketed = bucketSparkline(raw, 1);
    expect(bucketed).toHaveLength(2);
    expect(bucketed[0].views).toBe(10);
    expect(bucketed[0].enrollments).toBe(2);
    expect(bucketed[0].isSingleDay).toBe(true);
  });

  it('aggregates multiple days correctly when bucketSize > 1', () => {
    const raw: RawSparklinePoint[] = [
      { date: '2026-09-01', views: 10, enrollments: 2 },
      { date: '2026-09-02', views: 20, enrollments: 4 },
      { date: '2026-09-03', views: 30, enrollments: 6 },
      { date: '2026-09-04', views: 40, enrollments: 8 }
    ];

    const bucketed = bucketSparkline(raw, 2);
    expect(bucketed).toHaveLength(2);

    expect(bucketed[0].views).toBe(30);
    expect(bucketed[0].enrollments).toBe(6);
    expect(bucketed[0].isSingleDay).toBe(false);
    expect(bucketed[0].rawCount).toBe(2);

    expect(bucketed[1].views).toBe(70);
    expect(bucketed[1].enrollments).toBe(14);
    expect(bucketed[1].isSingleDay).toBe(false);
    expect(bucketed[1].rawCount).toBe(2);
  });

  it('handles partial remainder chunks at the end', () => {
    const raw: RawSparklinePoint[] = [
      { date: '2026-09-01', views: 10, enrollments: 1 },
      { date: '2026-09-02', views: 20, enrollments: 2 },
      { date: '2026-09-03', views: 30, enrollments: 3 }
    ];

    const bucketed = bucketSparkline(raw, 2);
    expect(bucketed).toHaveLength(2);
    expect(bucketed[0].rawCount).toBe(2);
    expect(bucketed[1].rawCount).toBe(1);
    expect(bucketed[1].isSingleDay).toBe(true);
    expect(bucketed[1].views).toBe(30);
  });
});

describe('formatChartTooltipDate', () => {
  it('formats single day date', () => {
    const d = new Date(2026, 8, 1); // Sep 1, 2026
    const point: BucketedChartPoint = {
      date: d,
      endDate: d,
      views: 10,
      enrollments: 2,
      isSingleDay: true,
      rawCount: 1
    };

    const formatted = formatChartTooltipDate(d, point);
    expect(formatted).toContain('Sep 1, 2026');
  });

  it('formats range across same month', () => {
    const d1 = new Date(2026, 8, 1);
    const d2 = new Date(2026, 8, 7);
    const point: BucketedChartPoint = {
      date: d1,
      endDate: d2,
      views: 70,
      enrollments: 14,
      isSingleDay: false,
      rawCount: 7
    };

    const formatted = formatChartTooltipDate(d1, point);
    expect(formatted).toBe('Sep 1 – 7, 2026');
  });

  it('formats range across different months', () => {
    const d1 = new Date(2026, 7, 28); // Aug 28
    const d2 = new Date(2026, 8, 3); // Sep 3
    const point: BucketedChartPoint = {
      date: d1,
      endDate: d2,
      views: 70,
      enrollments: 14,
      isSingleDay: false,
      rawCount: 7
    };

    const formatted = formatChartTooltipDate(d1, point);
    expect(formatted).toBe('Aug 28 – Sep 3, 2026');
  });
});
