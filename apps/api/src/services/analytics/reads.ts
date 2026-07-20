import {
  selectCountryBreakdown,
  selectCourseDailyRange,
  selectOrgDailyRange,
  selectPopularCourseTypes
} from '@cio/db/queries/analytics';
import { DASH_ANALYTICS_TTL_SECONDS, dashAnalyticsKey } from '@api/utils/redis/key-generators';
import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

export type LandingStats = {
  totals: {
    landingViews: number;
    coursePageViews: number;
    docPageViews: number;
    uniqueVisitors: number;
    enrollments: number;
    completions: number;
  };
  sparkline: Array<{ date: string; views: number; enrollments: number }>;
};

export type CountryBreakdown = Array<{ country: string; views: number; enrollments: number }>;

export type CourseFunnel = {
  steps: Array<{
    name: 'landing_view' | 'doc_page_view' | 'course_page_view' | 'enrollment_completed' | 'course_completed';
    count: number;
    conversionFromPrev: number | null;
  }>;
};

export type PopularTypes = Array<{
  type: string;
  enrollments: number;
  views: number;
  completions: number;
  courseCount: number;
}>;

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeRange(days: number): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { fromDate: toDateString(from), toDate: toDateString(today) };
}

async function readCache<T>(key: string): Promise<T | null> {
  if (!env.REDIS_URL) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for analytics cache, using database', error);
    return null;
  }
}

async function writeCache(key: string, value: unknown): Promise<void> {
  if (!env.REDIS_URL) return;
  try {
    await redis.setEx(key, DASH_ANALYTICS_TTL_SECONDS, JSON.stringify(value));
  } catch (error) {
    logRedisUnavailableOnce('Redis set failed for analytics cache, continuing', error);
  }
}

export async function getLandingStats(orgId: string, days: number, bustCache = false): Promise<LandingStats> {
  const key = dashAnalyticsKey('landing', orgId, days);
  if (!bustCache) {
    const cached = await readCache<LandingStats>(key);
    if (cached) return cached;
  }

  const { fromDate, toDate } = computeRange(days);
  const rows = await selectOrgDailyRange(orgId, fromDate, toDate);

  const totals = rows.reduce(
    (acc, row) => ({
      landingViews: acc.landingViews + row.landingViews,
      coursePageViews: acc.coursePageViews + row.coursePageViews,
      docPageViews: acc.docPageViews + row.docPageViews,
      uniqueVisitors: acc.uniqueVisitors + row.uniqueVisitors,
      enrollments: acc.enrollments + row.enrollments,
      completions: acc.completions + row.completions
    }),
    { landingViews: 0, coursePageViews: 0, docPageViews: 0, uniqueVisitors: 0, enrollments: 0, completions: 0 }
  );

  const sparkline = rows.map((row) => ({
    date: row.date,
    views: row.landingViews + row.coursePageViews + row.docPageViews,
    enrollments: row.enrollments
  }));

  const result: LandingStats = { totals, sparkline };
  await writeCache(key, result);
  return result;
}

export async function getCountryBreakdown(orgId: string, days: number, bustCache = false): Promise<CountryBreakdown> {
  const key = dashAnalyticsKey('country', orgId, days);
  if (!bustCache) {
    const cached = await readCache<CountryBreakdown>(key);
    if (cached) return cached;
  }

  const { fromDate, toDate } = computeRange(days);
  const rows = await selectCountryBreakdown(orgId, fromDate, toDate);
  const result: CountryBreakdown = rows.map((row) => ({
    country: row.country,
    views: row.views,
    enrollments: row.enrollments
  }));
  await writeCache(key, result);
  return result;
}

export async function getCourseFunnel(
  orgId: string,
  days: number,
  courseId: string | undefined,
  bustCache = false
): Promise<CourseFunnel> {
  const key = dashAnalyticsKey('funnel', orgId, days, courseId);
  if (!bustCache) {
    const cached = await readCache<CourseFunnel>(key);
    if (cached) return cached;
  }

  const { fromDate, toDate } = computeRange(days);

  let landingViews = 0;
  let docPageViews = 0;
  let coursePageViews = 0;
  let enrollments = 0;
  let completions = 0;

  if (courseId) {
    const rows = await selectCourseDailyRange(courseId, orgId, fromDate, toDate);
    coursePageViews = rows.reduce((sum, r) => sum + r.views, 0);
    enrollments = rows.reduce((sum, r) => sum + r.enrollments, 0);
    completions = rows.reduce((sum, r) => sum + r.completions, 0);
  } else {
    const rows = await selectOrgDailyRange(orgId, fromDate, toDate);
    landingViews = rows.reduce((sum, r) => sum + r.landingViews, 0);
    docPageViews = rows.reduce((sum, r) => sum + r.docPageViews, 0);
    coursePageViews = rows.reduce((sum, r) => sum + r.coursePageViews, 0);
    enrollments = rows.reduce((sum, r) => sum + r.enrollments, 0);
    completions = rows.reduce((sum, r) => sum + r.completions, 0);
  }

  const stepValues = [
    { name: 'landing_view' as const, count: landingViews },
    { name: 'doc_page_view' as const, count: docPageViews },
    { name: 'course_page_view' as const, count: coursePageViews },
    { name: 'enrollment_completed' as const, count: enrollments },
    { name: 'course_completed' as const, count: completions }
  ];

  const steps = stepValues
    .filter((step) => {
      if (!courseId) return true;
      return step.name !== 'landing_view' && step.name !== 'doc_page_view';
    })
    .map((step, index, arr) => {
      const prev = index > 0 ? arr[index - 1].count : null;
      const conversionFromPrev = prev && prev > 0 ? step.count / prev : null;
      return { ...step, conversionFromPrev };
    });

  const result: CourseFunnel = { steps };
  await writeCache(key, result);
  return result;
}

export async function getPopularTypes(orgId: string, days: number, bustCache = false): Promise<PopularTypes> {
  const key = dashAnalyticsKey('popular-types', orgId, days);
  if (!bustCache) {
    const cached = await readCache<PopularTypes>(key);
    if (cached) return cached;
  }

  const { fromDate, toDate } = computeRange(days);
  const rows = await selectPopularCourseTypes(orgId, fromDate, toDate);
  const result: PopularTypes = rows
    .filter((row) => row.type)
    .map((row) => ({
      type: row.type as string,
      enrollments: row.enrollments,
      views: row.views,
      completions: row.completions,
      courseCount: row.courseCount
    }));
  await writeCache(key, result);
  return result;
}
