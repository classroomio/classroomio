export type RawSparklinePoint = {
  date: string;
  views: number;
  enrollments: number;
};

export type BucketedChartPoint = {
  date: Date;
  endDate: Date;
  views: number;
  enrollments: number;
  isSingleDay: boolean;
  rawCount: number;
};

export function getBucketSize(totalDays: number, containerWidth: number): number {
  if (totalDays <= 7) return 1;

  if (totalDays <= 31) {
    if (containerWidth >= 800) return 2;
    if (containerWidth >= 500) return 3;
    return 4;
  }

  if (containerWidth >= 1000) return 4;
  if (containerWidth >= 700) return 4;
  if (containerWidth >= 450) return 5;
  return 14;
}

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

  if (bucketSize <= 1) {
    return sparkline.map((d) => {
      const [year, month, day] = d.date.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return {
        date,
        endDate: date,
        views: d.views,
        enrollments: d.enrollments,
        isSingleDay: true,
        rawCount: 1
      };
    });
  }

  const result: BucketedChartPoint[] = [];

  for (let i = 0; i < sparkline.length; i += bucketSize) {
    const chunk = sparkline.slice(i, i + bucketSize);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    const [y1, m1, d1] = first.date.split('-');
    const startDate = new Date(Number(y1), Number(m1) - 1, Number(d1));

    const [y2, m2, d2] = last.date.split('-');
    const endDate = new Date(Number(y2), Number(m2) - 1, Number(d2));

    const views = chunk.reduce((sum, item) => sum + item.views, 0);
    const enrollments = chunk.reduce((sum, item) => sum + item.enrollments, 0);

    result.push({
      date: startDate,
      endDate,
      views,
      enrollments,
      isSingleDay: chunk.length === 1,
      rawCount: chunk.length
    });
  }

  return result;
}

export function formatChartTooltipDate(date: Date, point?: BucketedChartPoint): string {
  if (!point || point.isSingleDay) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const startFormatted = point.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const isSameMonth =
    point.date.getMonth() === point.endDate.getMonth() && point.date.getFullYear() === point.endDate.getFullYear();

  const endFormatted = point.endDate.toLocaleDateString('en-US', {
    month: isSameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `${startFormatted} – ${endFormatted}`;
}
