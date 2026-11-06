export type BucketCombine = 'sum';

export type ChartBucket = { date: Date; endDate: Date; isSingleDay: boolean; rawCount: number };

export type ChartAxisTickProps = { x: number; y: number; value: string };

type DailyPoint<TKey extends string> = { date: string } & Record<TKey, number | null>;

export const DATE_TICK_MIN_WIDTH = 56;
export const EXERCISE_TICK_MIN_WIDTH = 96;

function parseDay(day: string): Date {
  const [year, month, date] = day.split('-');

  return new Date(Number(year), Number(month) - 1, Number(date));
}

function combineValues(values: Array<number | null>, _combine: BucketCombine): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;

  return present.reduce((sum, value) => sum + value, 0);
}

/**
 * Groups consecutive days into buckets of `bucketSize`, summing each series.
 */
export function bucketDailySeries<TKey extends string>(
  points: ReadonlyArray<DailyPoint<TKey>>,
  keys: readonly TKey[],
  bucketSize: number,
  combine: BucketCombine
): Array<ChartBucket & Record<TKey, number | null>> {
  const size = Math.max(1, bucketSize);
  const buckets: Array<ChartBucket & Record<TKey, number | null>> = [];

  for (let start = 0; start < points.length; start += size) {
    const chunk = points.slice(start, start + size);
    const values = Object.fromEntries(
      keys.map((key) => [
        key,
        combineValues(
          chunk.map((point) => point[key]),
          combine
        )
      ])
    ) as Record<TKey, number | null>;
    const date = parseDay(chunk[0].date);
    const endDate = parseDay(chunk[chunk.length - 1].date);

    buckets.push({ ...values, date, endDate, isSingleDay: chunk.length === 1, rawCount: chunk.length });
  }

  return buckets;
}

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

/**
 * Every n-th axis value, so that each label gets at least `minLabelWidth` pixels of the chart's width.
 */
export function visibleTicks<TValue>(
  values: readonly TValue[],
  containerWidth: number,
  minLabelWidth: number = DATE_TICK_MIN_WIDTH
): TValue[] {
  if (containerWidth <= 0) return [...values];

  const maxLabels = Math.max(2, Math.floor(containerWidth / minLabelWidth));
  const step = Math.max(1, Math.ceil(values.length / maxLabels));

  return values.filter((_, index) => index % step === 0);
}

/**
 * Shortens an axis label to what its tick can show at the chart's current width, so labels never overlap.
 */
export function truncateTickLabel(label: string, containerWidth: number, tickCount: number): string {
  const availablePerTick = tickCount > 0 ? containerWidth / tickCount : 120;
  const maxChars = Math.max(8, Math.min(20, Math.floor((availablePerTick - 16) / 7.5)));

  return label.length > maxChars ? `${label.slice(0, maxChars)}…` : label;
}

export function formatChartTooltipDate(date: Date, point?: ChartBucket, locale?: string): string {
  if (!point || point.isSingleDay) {
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const startFormatted = point.date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric'
  });

  const isSameMonth =
    point.date.getMonth() === point.endDate.getMonth() && point.date.getFullYear() === point.endDate.getFullYear();

  const endFormatted = isSameMonth
    ? `${point.endDate.toLocaleDateString(locale, { day: 'numeric' })}, ${point.endDate.getFullYear()}`
    : point.endDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

  return `${startFormatted} – ${endFormatted}`;
}
