import * as schema from '@db/schema';

import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

type PageEventInsert = typeof schema.analyticsPageEvent.$inferInsert;
type OrgDailyInsert = typeof schema.analyticsOrgDaily.$inferInsert;
type CourseDailyInsert = typeof schema.analyticsCourseDaily.$inferInsert;
type CountryDailyInsert = typeof schema.analyticsCountryDaily.$inferInsert;

export async function insertPageEvents(events: PageEventInsert[]) {
  if (events.length === 0) {
    return 0;
  }

  try {
    const inserted = await db
      .insert(schema.analyticsPageEvent)
      .values(events)
      .returning({ id: schema.analyticsPageEvent.id });

    await bumpMemberLastActiveFromEvents(events);

    return inserted.length;
  } catch (error) {
    console.error('insertPageEvents error:', error);
    throw new Error('Failed to insert page events');
  }
}

export type MemberActivity = { orgId: string; userId: string; occurredAt: string };

/** Latest activity per (org, user), so ingest writes one row per member. */
export function collapseLatestActivityByMember(events: PageEventInsert[]): MemberActivity[] {
  const latestByMember = new Map<string, MemberActivity & { at: number }>();

  for (const event of events) {
    const { orgId, userId, occurredAt } = event;
    if (!orgId || !userId || !occurredAt) continue;

    // Instants, not strings: `/track` accepts any ISO string, so offsets mix.
    const at = new Date(occurredAt).getTime();
    if (Number.isNaN(at)) continue;

    const key = `${orgId}:${userId}`;
    const seen = latestByMember.get(key);

    if (!seen || at > seen.at) {
      latestByMember.set(key, { orgId, userId, occurredAt, at });
    }
  }

  return [...latestByMember.values()].map(({ orgId, userId, occurredAt }) => ({ orgId, userId, occurredAt }));
}

/**
 * Keeps `last_active_at` current from the events just ingested. Denormalized
 * because filtering a 20k-learner roster against the raw event table does not
 * hold up.
 *
 * Only moves forward, so replayed batches cannot walk activity backwards.
 * Best-effort — the nightly reconcile repairs any gap.
 */
async function bumpMemberLastActiveFromEvents(events: PageEventInsert[]): Promise<void> {
  const activities = collapseLatestActivityByMember(events);

  if (activities.length === 0) {
    return;
  }

  try {
    await Promise.all(
      activities.map((activity) =>
        db
          .update(schema.organizationmember)
          .set({ lastActiveAt: activity.occurredAt })
          .where(
            and(
              eq(schema.organizationmember.organizationId, activity.orgId),
              eq(schema.organizationmember.profileId, activity.userId),
              or(
                isNull(schema.organizationmember.lastActiveAt),
                lt(schema.organizationmember.lastActiveAt, activity.occurredAt)
              )
            )
          )
      )
    );
  } catch (error) {
    console.error('bumpMemberLastActiveFromEvents error:', error);
  }
}

export async function upsertOrgDailyRows(rows: OrgDailyInsert[]) {
  if (rows.length === 0) {
    return 0;
  }

  try {
    const result = await db
      .insert(schema.analyticsOrgDaily)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.analyticsOrgDaily.orgId, schema.analyticsOrgDaily.date],
        set: {
          landingViews: sql`excluded.landing_views`,
          uniqueVisitors: sql`excluded.unique_visitors`,
          coursePageViews: sql`excluded.course_page_views`,
          enrollments: sql`excluded.enrollments`,
          completions: sql`excluded.completions`,
          updatedAt: new Date().toISOString()
        }
      })
      .returning({ id: schema.analyticsOrgDaily.id });
    return result.length;
  } catch (error) {
    console.error('upsertOrgDailyRows error:', error);
    throw new Error('Failed to upsert analytics_org_daily rows');
  }
}

export async function upsertCourseDailyRows(rows: CourseDailyInsert[]) {
  if (rows.length === 0) {
    return 0;
  }

  try {
    const result = await db
      .insert(schema.analyticsCourseDaily)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.analyticsCourseDaily.courseId, schema.analyticsCourseDaily.date],
        set: {
          orgId: sql`excluded.org_id`,
          views: sql`excluded.views`,
          uniqueVisitors: sql`excluded.unique_visitors`,
          enrollments: sql`excluded.enrollments`,
          completions: sql`excluded.completions`,
          updatedAt: new Date().toISOString()
        }
      })
      .returning({ id: schema.analyticsCourseDaily.id });
    return result.length;
  } catch (error) {
    console.error('upsertCourseDailyRows error:', error);
    throw new Error('Failed to upsert analytics_course_daily rows');
  }
}

export async function upsertCountryDailyRows(rows: CountryDailyInsert[]) {
  if (rows.length === 0) {
    return 0;
  }

  try {
    const result = await db
      .insert(schema.analyticsCountryDaily)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          schema.analyticsCountryDaily.orgId,
          schema.analyticsCountryDaily.date,
          schema.analyticsCountryDaily.country
        ],
        set: {
          views: sql`excluded.views`,
          enrollments: sql`excluded.enrollments`,
          updatedAt: new Date().toISOString()
        }
      })
      .returning({ id: schema.analyticsCountryDaily.id });
    return result.length;
  } catch (error) {
    console.error('upsertCountryDailyRows error:', error);
    throw new Error('Failed to upsert analytics_country_daily rows');
  }
}

/**
 * Pre-aggregated org/date counts pulled from raw page events for the rollup job.
 * One row per (org_id, date) for events in [fromIso, toIso).
 */
export async function selectOrgDailyAggregates(fromIso: string, toIso: string) {
  try {
    return await db
      .select({
        orgId: schema.analyticsPageEvent.orgId,
        date: sql<string>`(${schema.analyticsPageEvent.occurredAt} AT TIME ZONE 'UTC')::date`.as('date'),
        landingViews:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'landing_view')::int`.as(
            'landing_views'
          ),
        coursePageViews:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'course_page_view')::int`.as(
            'course_page_views'
          ),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${schema.analyticsPageEvent.sessionId})::int`.as('unique_visitors'),
        enrollments:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'enrollment_completed')::int`.as(
            'enrollments'
          ),
        completions:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'course_completed')::int`.as(
            'completions'
          )
      })
      .from(schema.analyticsPageEvent)
      .where(
        and(
          sql`${schema.analyticsPageEvent.occurredAt} >= ${fromIso}`,
          sql`${schema.analyticsPageEvent.occurredAt} < ${toIso}`,
          sql`${schema.analyticsPageEvent.orgId} IS NOT NULL`
        )
      )
      .groupBy(schema.analyticsPageEvent.orgId, sql`date`);
  } catch (error) {
    console.error('selectOrgDailyAggregates error:', error);
    throw new Error('Failed to aggregate org/date page events');
  }
}

/**
 * Pre-aggregated course/date counts from raw page events for the rollup job.
 */
export async function selectCourseDailyAggregates(fromIso: string, toIso: string) {
  try {
    return await db
      .select({
        courseId: schema.analyticsPageEvent.courseId,
        orgId: schema.analyticsPageEvent.orgId,
        date: sql<string>`(${schema.analyticsPageEvent.occurredAt} AT TIME ZONE 'UTC')::date`.as('date'),
        views: sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'course_page_view')::int`.as(
          'views'
        ),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${schema.analyticsPageEvent.sessionId})::int`.as('unique_visitors'),
        enrollments:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'enrollment_completed')::int`.as(
            'enrollments'
          ),
        completions:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'course_completed')::int`.as(
            'completions'
          )
      })
      .from(schema.analyticsPageEvent)
      .where(
        and(
          sql`${schema.analyticsPageEvent.occurredAt} >= ${fromIso}`,
          sql`${schema.analyticsPageEvent.occurredAt} < ${toIso}`,
          sql`${schema.analyticsPageEvent.courseId} IS NOT NULL`,
          sql`${schema.analyticsPageEvent.orgId} IS NOT NULL`
        )
      )
      .groupBy(schema.analyticsPageEvent.courseId, schema.analyticsPageEvent.orgId, sql`date`);
  } catch (error) {
    console.error('selectCourseDailyAggregates error:', error);
    throw new Error('Failed to aggregate course/date page events');
  }
}

/**
 * Pre-aggregated org/date/country counts from raw page events for the rollup job.
 */
export async function selectCountryDailyAggregates(fromIso: string, toIso: string) {
  try {
    return await db
      .select({
        orgId: schema.analyticsPageEvent.orgId,
        date: sql<string>`(${schema.analyticsPageEvent.occurredAt} AT TIME ZONE 'UTC')::date`.as('date'),
        country: schema.analyticsPageEvent.country,
        views:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} IN ('landing_view', 'course_page_view'))::int`.as(
            'views'
          ),
        enrollments:
          sql<number>`COUNT(*) FILTER (WHERE ${schema.analyticsPageEvent.eventType} = 'enrollment_completed')::int`.as(
            'enrollments'
          )
      })
      .from(schema.analyticsPageEvent)
      .where(
        and(
          sql`${schema.analyticsPageEvent.occurredAt} >= ${fromIso}`,
          sql`${schema.analyticsPageEvent.occurredAt} < ${toIso}`,
          sql`${schema.analyticsPageEvent.orgId} IS NOT NULL`,
          sql`${schema.analyticsPageEvent.country} IS NOT NULL`
        )
      )
      .groupBy(schema.analyticsPageEvent.orgId, sql`date`, schema.analyticsPageEvent.country);
  } catch (error) {
    console.error('selectCountryDailyAggregates error:', error);
    throw new Error('Failed to aggregate country page events');
  }
}

/**
 * Right-to-be-forgotten: null out user_id on past events for a given user.
 * Rollups remain (aggregate only); raw events stay queryable but anonymous.
 */
export async function deidentifyPageEventsForUser(userId: string) {
  try {
    const result = await db
      .update(schema.analyticsPageEvent)
      .set({ userId: null })
      .where(eq(schema.analyticsPageEvent.userId, userId))
      .returning({ id: schema.analyticsPageEvent.id });
    return result.length;
  } catch (error) {
    console.error('deidentifyPageEventsForUser error:', error);
    throw new Error('Failed to deidentify page events for user');
  }
}
