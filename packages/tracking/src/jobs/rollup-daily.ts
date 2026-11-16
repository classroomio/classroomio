import {
  selectCountryDailyAggregates,
  selectCourseDailyAggregates,
  selectOrgDailyAggregates,
  upsertCountryDailyRows,
  upsertCourseDailyRows,
  upsertOrgDailyRows
} from '@cio/db/queries/tracking';

type RollupResult = {
  windowStart: string;
  windowEnd: string;
  orgRows: number;
  courseRows: number;
  countryRows: number;
};

/**
 * Compute UTC midnight boundaries for the day `daysAgo` before today.
 * daysAgo=1 → yesterday (full day window).
 */
function getDayBoundsUtc(daysAgo: number): { startIso: string; endIso: string } {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
  const next = new Date(target);
  next.setUTCDate(next.getUTCDate() + 1);
  return { startIso: target.toISOString(), endIso: next.toISOString() };
}

/**
 * Aggregates raw page events into the daily rollup tables (org / course /
 * country) for one UTC day. `daysAgo: 0` is today so far, `1` is yesterday.
 * Idempotent: rows are upserted on their unique keys, so re-running is safe.
 */
export async function runTrackingRollupDaily(opts: { daysAgo?: number } = {}): Promise<RollupResult> {
  const daysAgo = opts.daysAgo ?? 1;
  const { startIso, endIso } = getDayBoundsUtc(daysAgo);

  const [orgAgg, courseAgg, countryAgg] = await Promise.all([
    selectOrgDailyAggregates(startIso, endIso),
    selectCourseDailyAggregates(startIso, endIso),
    selectCountryDailyAggregates(startIso, endIso)
  ]);

  const orgRows = orgAgg
    .filter((row) => row.orgId)
    .map((row) => ({
      orgId: row.orgId as string,
      date: row.date,
      landingViews: row.landingViews,
      uniqueVisitors: row.uniqueVisitors,
      coursePageViews: row.coursePageViews,
      enrollments: row.enrollments,
      completions: row.completions
    }));

  const courseRows = courseAgg
    .filter((row) => row.courseId && row.orgId)
    .map((row) => ({
      courseId: row.courseId as string,
      orgId: row.orgId as string,
      date: row.date,
      views: row.views,
      uniqueVisitors: row.uniqueVisitors,
      enrollments: row.enrollments,
      completions: row.completions
    }));

  const countryRows = countryAgg
    .filter((row) => row.orgId && row.country)
    .map((row) => ({
      orgId: row.orgId as string,
      date: row.date,
      country: row.country as string,
      views: row.views,
      enrollments: row.enrollments
    }));

  const [orgWritten, courseWritten, countryWritten] = await Promise.all([
    upsertOrgDailyRows(orgRows),
    upsertCourseDailyRows(courseRows),
    upsertCountryDailyRows(countryRows)
  ]);

  return {
    windowStart: startIso,
    windowEnd: endIso,
    orgRows: orgWritten,
    courseRows: courseWritten,
    countryRows: countryWritten
  };
}

/**
 * Rolls up yesterday, then today so far. Yesterday is re-run so events that
 * landed after the previous day's last run still count.
 */
export async function runTrackingRollupRecent(): Promise<RollupResult[]> {
  const yesterday = await runTrackingRollupDaily({ daysAgo: 1 });
  const today = await runTrackingRollupDaily({ daysAgo: 0 });

  return [yesterday, today];
}
