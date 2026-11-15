import * as schema from '@db/schema';

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

/**
 * Aggregate enrollments and course-page views by `course.type` for an org
 * in a date range. Joins the daily course rollup with the canonical course
 * row so the result groups by the enum (SELF_PACED / LIVE_CLASS / COMPLIANCE
 * / PUBLIC).
 */
export async function selectPopularCourseTypes(orgId: string, fromDate: string, toDate: string) {
  try {
    return await db
      .select({
        type: schema.course.type,
        enrollments: sql<number>`SUM(${schema.analyticsCourseDaily.enrollments})::int`.as('enrollments'),
        views: sql<number>`SUM(${schema.analyticsCourseDaily.views})::int`.as('views'),
        completions: sql<number>`SUM(${schema.analyticsCourseDaily.completions})::int`.as('completions'),
        courseCount: sql<number>`COUNT(DISTINCT ${schema.analyticsCourseDaily.courseId})::int`.as('course_count')
      })
      .from(schema.analyticsCourseDaily)
      .innerJoin(schema.course, eq(schema.course.id, schema.analyticsCourseDaily.courseId))
      .where(
        and(
          eq(schema.analyticsCourseDaily.orgId, orgId),
          sql`${schema.analyticsCourseDaily.date} >= ${fromDate}`,
          sql`${schema.analyticsCourseDaily.date} <= ${toDate}`
        )
      )
      .groupBy(schema.course.type)
      .orderBy(desc(sql`SUM(${schema.analyticsCourseDaily.enrollments})`));
  } catch (error) {
    console.error('selectPopularCourseTypes error:', error);
    throw new Error('Failed to select popular course types');
  }
}

/**
 * Top courses by page views for an org in a date range. Joins the daily
 * course rollup with the canonical course row so the result includes the
 * live title. Courses with zero views in the window are omitted.
 */
export async function selectTopCoursesByViews(orgId: string, fromDate: string, toDate: string, limit: number = 10) {
  try {
    return await db
      .select({
        courseId: schema.analyticsCourseDaily.courseId,
        title: schema.course.title,
        views: sql<number>`SUM(${schema.analyticsCourseDaily.views})::int`.as('views')
      })
      .from(schema.analyticsCourseDaily)
      .innerJoin(schema.course, eq(schema.course.id, schema.analyticsCourseDaily.courseId))
      .where(
        and(
          eq(schema.analyticsCourseDaily.orgId, orgId),
          sql`${schema.analyticsCourseDaily.date} >= ${fromDate}`,
          sql`${schema.analyticsCourseDaily.date} <= ${toDate}`
        )
      )
      .groupBy(schema.analyticsCourseDaily.courseId, schema.course.title)
      .having(sql`SUM(${schema.analyticsCourseDaily.views}) > 0`)
      .orderBy(desc(sql`SUM(${schema.analyticsCourseDaily.views})`), asc(schema.analyticsCourseDaily.courseId))
      .limit(limit);
  } catch (error) {
    console.error('selectTopCoursesByViews error:', error);
    throw new Error('Failed to select top courses by views');
  }
}

/**
 * Per-day org rollup rows for a date range, ordered ascending by date.
 * Used by landing-stats (totals + sparkline) and course-funnel.
 */
export async function selectOrgDailyRange(orgId: string, fromDate: string, toDate: string) {
  try {
    return await db
      .select({
        date: schema.analyticsOrgDaily.date,
        landingViews: schema.analyticsOrgDaily.landingViews,
        uniqueVisitors: schema.analyticsOrgDaily.uniqueVisitors,
        coursePageViews: schema.analyticsOrgDaily.coursePageViews,
        enrollments: schema.analyticsOrgDaily.enrollments,
        completions: schema.analyticsOrgDaily.completions
      })
      .from(schema.analyticsOrgDaily)
      .where(
        and(
          eq(schema.analyticsOrgDaily.orgId, orgId),
          sql`${schema.analyticsOrgDaily.date} >= ${fromDate}`,
          sql`${schema.analyticsOrgDaily.date} <= ${toDate}`
        )
      )
      .orderBy(schema.analyticsOrgDaily.date);
  } catch (error) {
    console.error('selectOrgDailyRange error:', error);
    throw new Error('Failed to select org daily range');
  }
}

/**
 * Per-day rows for a single course in a date range. If the courseId belongs
 * to a different org the result is empty (no row matches both filters).
 */
export async function selectCourseDailyRange(courseId: string, orgId: string, fromDate: string, toDate: string) {
  try {
    return await db
      .select({
        date: schema.analyticsCourseDaily.date,
        views: schema.analyticsCourseDaily.views,
        uniqueVisitors: schema.analyticsCourseDaily.uniqueVisitors,
        enrollments: schema.analyticsCourseDaily.enrollments,
        completions: schema.analyticsCourseDaily.completions
      })
      .from(schema.analyticsCourseDaily)
      .where(
        and(
          eq(schema.analyticsCourseDaily.courseId, courseId),
          eq(schema.analyticsCourseDaily.orgId, orgId),
          sql`${schema.analyticsCourseDaily.date} >= ${fromDate}`,
          sql`${schema.analyticsCourseDaily.date} <= ${toDate}`
        )
      )
      .orderBy(schema.analyticsCourseDaily.date);
  } catch (error) {
    console.error('selectCourseDailyRange error:', error);
    throw new Error('Failed to select course daily range');
  }
}

/**
 * Top countries by views for an org over a date range.
 */
export async function selectCountryBreakdown(orgId: string, fromDate: string, toDate: string, limit: number = 20) {
  try {
    return await db
      .select({
        country: schema.analyticsCountryDaily.country,
        views: sql<number>`SUM(${schema.analyticsCountryDaily.views})::int`.as('views'),
        enrollments: sql<number>`SUM(${schema.analyticsCountryDaily.enrollments})::int`.as('enrollments')
      })
      .from(schema.analyticsCountryDaily)
      .where(
        and(
          eq(schema.analyticsCountryDaily.orgId, orgId),
          sql`${schema.analyticsCountryDaily.date} >= ${fromDate}`,
          sql`${schema.analyticsCountryDaily.date} <= ${toDate}`
        )
      )
      .groupBy(schema.analyticsCountryDaily.country)
      .orderBy(desc(sql`SUM(${schema.analyticsCountryDaily.views})`))
      .limit(limit);
  } catch (error) {
    console.error('selectCountryBreakdown error:', error);
    throw new Error('Failed to select country breakdown');
  }
}
