import {
  bucketDailySeries,
  formatChartTooltipDate,
  getBucketSize,
  type ChartBucket
} from '$features/ui/analytics/chart-buckets';

export const MARKETING_RANGE_DAYS = [7, 30, 90] as const;

export type RawSparklinePoint = {
  date: string;
  views: number;
  enrollments: number;
};

export type BucketedChartPoint = ChartBucket & { views: number; enrollments: number };

export { getBucketSize, formatChartTooltipDate };

export function zeroFillRange(
  sparkline: RawSparklinePoint[] | undefined | null,
  days: number,
  endDate: Date = new Date()
): RawSparklinePoint[] {
  if (days <= 0) return [];

  const byDate = new Map<string, RawSparklinePoint>();
  sparkline?.forEach((point) => {
    byDate.set(point.date, point);
  });

  const result: RawSparklinePoint[] = [];
  // Build the window from UTC calendar dates so day keys match the server's UTC
  // analytics range (computed via toISOString().slice(0, 10)) regardless of the
  // viewer's local timezone.
  const cursor = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(cursor - i * 86400000);
    const dateString = toDateString(date);
    const real = byDate.get(dateString);

    result.push(
      real ?? {
        date: dateString,
        views: 0,
        enrollments: 0
      }
    );
  }

  return result;
}

function toDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function bucketSparkline(
  sparkline: RawSparklinePoint[] | undefined | null,
  bucketSize: number
): BucketedChartPoint[] {
  if (!sparkline || sparkline.length === 0) return [];

  return bucketDailySeries(sparkline, ['views', 'enrollments'], bucketSize, 'sum') as BucketedChartPoint[];
}
