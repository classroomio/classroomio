import {
  selectCountryDailyAggregates,
  selectCourseDailyAggregates,
  selectNoteDailyAggregates,
  selectOrgDailyAggregates,
  upsertCountryDailyRows,
  upsertCourseDailyRows,
  upsertNoteDailyRows,
  upsertOrgDailyRows
} from '@cio/db/queries/analytics';

type RollupResult = {
  windowStart: string;
  windowEnd: string;
  orgRows: number;
  courseRows: number;
  noteRows: number;
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
 * country) for a single UTC day window. Idempotent — UPSERT keyed on the
 * unique constraints. Safe to re-run.
 *
 * Default window: yesterday (00:00–24:00 UTC).
 */
export async function runAnalyticsRollupDaily(opts: { daysAgo?: number } = {}): Promise<RollupResult> {
  const daysAgo = opts.daysAgo ?? 1;
  const { startIso, endIso } = getDayBoundsUtc(daysAgo);

  const [orgAgg, courseAgg, noteAgg, countryAgg] = await Promise.all([
    selectOrgDailyAggregates(startIso, endIso),
    selectCourseDailyAggregates(startIso, endIso),
    selectNoteDailyAggregates(startIso, endIso),
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
      notePageViews: row.notePageViews,
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

  const noteRows = noteAgg
    .filter((row) => row.noteId && row.orgId)
    .map((row) => ({
      noteId: row.noteId as string,
      orgId: row.orgId as string,
      date: row.date,
      views: row.views,
      uniqueVisitors: row.uniqueVisitors
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

  const [orgWritten, courseWritten, noteWritten, countryWritten] = await Promise.all([
    upsertOrgDailyRows(orgRows),
    upsertCourseDailyRows(courseRows),
    upsertNoteDailyRows(noteRows),
    upsertCountryDailyRows(countryRows)
  ]);

  return {
    windowStart: startIso,
    windowEnd: endIso,
    orgRows: orgWritten,
    courseRows: courseWritten,
    noteRows: noteWritten,
    countryRows: countryWritten
  };
}
