import * as schema from '@db/schema';

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

function toIsoTimestamp(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function pickLatestTimestamp(...values: Array<string | Date | null | undefined>): string | null {
  let latest: string | null = null;
  let latestTime = -Infinity;

  for (const value of values) {
    const iso = toIsoTimestamp(value);
    if (!iso) {
      continue;
    }

    const time = new Date(iso).getTime();
    if (time > latestTime) {
      latestTime = time;
      latest = iso;
    }
  }

  return latest;
}

/**
 * Gets the last seen time for a user from login events and active sessions.
 * @param userId User ID
 * @returns Last seen timestamp or null
 */
export async function getLastLogin(userId: string): Promise<string | null> {
  try {
    const [[loginEvent], [sessionEvent]] = await Promise.all([
      db
        .select({
          loggedInAt: schema.analyticsLoginEvents.loggedInAt
        })
        .from(schema.analyticsLoginEvents)
        .where(eq(schema.analyticsLoginEvents.userId, userId))
        .orderBy(desc(schema.analyticsLoginEvents.loggedInAt))
        .limit(1),
      db
        .select({
          updatedAt: schema.session.updatedAt
        })
        .from(schema.session)
        .where(eq(schema.session.userId, userId))
        .orderBy(desc(schema.session.updatedAt))
        .limit(1)
    ]);

    return pickLatestTimestamp(loginEvent?.loggedInAt, sessionEvent?.updatedAt);
  } catch (error) {
    console.error('getLastLogin error:', error);
    return null;
  }
}

/**
 * Batch lookup of last seen timestamps for multiple users.
 * @param userIds User IDs
 * @returns Map of user ID to last seen ISO timestamp
 */
export async function getLastSeenForUserIds(userIds: string[]): Promise<Map<string, string | null>> {
  const uniqueUserIds = [...new Set(userIds)];
  const lastSeenByUserId = new Map<string, string | null>(uniqueUserIds.map((userId) => [userId, null]));

  if (uniqueUserIds.length === 0) {
    return lastSeenByUserId;
  }

  try {
    const [loginRows, sessionRows] = await Promise.all([
      db
        .select({
          userId: schema.analyticsLoginEvents.userId,
          lastSeen: sql<string>`MAX(${schema.analyticsLoginEvents.loggedInAt})`.as('last_seen')
        })
        .from(schema.analyticsLoginEvents)
        .where(inArray(schema.analyticsLoginEvents.userId, uniqueUserIds))
        .groupBy(schema.analyticsLoginEvents.userId),
      db
        .select({
          userId: schema.session.userId,
          lastSeen: sql<string>`MAX(${schema.session.updatedAt})`.as('last_seen')
        })
        .from(schema.session)
        .where(inArray(schema.session.userId, uniqueUserIds))
        .groupBy(schema.session.userId)
    ]);

    for (const row of loginRows) {
      const current = lastSeenByUserId.get(row.userId) ?? null;
      lastSeenByUserId.set(row.userId, pickLatestTimestamp(current, row.lastSeen));
    }

    for (const row of sessionRows) {
      const current = lastSeenByUserId.get(row.userId) ?? null;
      lastSeenByUserId.set(row.userId, pickLatestTimestamp(current, row.lastSeen));
    }

    return lastSeenByUserId;
  } catch (error) {
    console.error('getLastSeenForUserIds error:', error);
    return lastSeenByUserId;
  }
}

/**
 * Gets user exercise statistics for a course
 * @param courseId Course ID
 * @param userId User ID (profile ID)
 * @returns Array of exercise stats with scores and completion status
 */
export async function getUserExercisesStats(courseId: string, userId: string) {
  try {
    const exercises = await db
      .select({
        id: schema.exercise.id,
        title: schema.exercise.title,
        lessonId: schema.exercise.lessonId,
        lessonTitle: schema.lesson.title
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));

    if (exercises.length === 0) {
      return [];
    }

    const exerciseIds = exercises.map((e) => e.id);

    // Get questions for these exercises with points
    const questions = await db
      .select({
        exerciseId: schema.question.exerciseId,
        points: schema.question.points
      })
      .from(schema.question)
      .where(inArray(schema.question.exerciseId, exerciseIds));

    // Get groupmember for the user in this course's group
    const course = await db
      .select({
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!course[0] || !course[0].groupId) {
      return [];
    }

    const groupMember = await db
      .select({
        id: schema.groupmember.id
      })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, course[0].groupId), eq(schema.groupmember.profileId, userId)))
      .limit(1);

    if (!groupMember[0]) {
      return [];
    }

    // Get submissions for these exercises by this user
    const submissions = await db
      .select({
        id: schema.submission.id,
        exerciseId: schema.submission.exerciseId,
        total: schema.submission.total,
        statusId: schema.submission.statusId
      })
      .from(schema.submission)
      .where(
        and(inArray(schema.submission.exerciseId, exerciseIds), eq(schema.submission.submittedBy, groupMember[0].id))
      );

    // Build exercise stats
    const exerciseStats = exercises.map((exercise) => {
      const exerciseQuestions = questions.filter((q) => q.exerciseId === exercise.id);
      const totalPoints = exerciseQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

      const userSubmission = submissions.find((s) => s.exerciseId === exercise.id);
      return {
        id: exercise.id,
        lessonId: exercise.lessonId,
        lessonTitle: exercise.lessonTitle || '',
        title: exercise.title,
        status: userSubmission?.statusId,
        score: userSubmission?.total || 0,
        totalPoints,
        isCompleted: !!userSubmission
      };
    });

    return exerciseStats;
  } catch (error) {
    console.error('getUserExerciseStats error:', error);
    return [];
  }
}

/**
 * Gets lessons with completion status for a user in a course
 * @param courseId Course ID
 * @param userId User ID (profile ID)
 * @returns Array of lessons with completion status
 */
export async function getLessonsWithCompletion(courseId: string, userId: string) {
  try {
    const lessons = await db
      .select({
        id: schema.lesson.id,
        title: schema.lesson.title,
        createdAt: schema.lesson.createdAt
      })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    const lessonIds = lessons.map((l) => l.id);

    if (lessonIds.length === 0) {
      return lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        created_at: lesson.createdAt,
        completed: false,
        exerciseNo: 0
      }));
    }

    // Get lesson completions
    const completions = await db
      .select({
        lessonId: schema.lessonCompletion.lessonId
      })
      .from(schema.lessonCompletion)
      .where(
        and(
          inArray(schema.lessonCompletion.lessonId, lessonIds),
          eq(schema.lessonCompletion.profileId, userId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    // Get exercise counts per lesson
    const exercises = await db
      .select({
        lessonId: schema.exercise.lessonId
      })
      .from(schema.exercise)
      .where(inArray(schema.exercise.lessonId, lessonIds));

    const completionSet = new Set(completions.map((c) => c.lessonId).filter((id): id is string => id !== null));
    const exerciseCounts = new Map<string, number>();
    exercises.forEach((e) => {
      if (e.lessonId) {
        exerciseCounts.set(e.lessonId, (exerciseCounts.get(e.lessonId) || 0) + 1);
      }
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      created_at: lesson.createdAt,
      completed: completionSet.has(lesson.id),
      exerciseNo: exerciseCounts.get(lesson.id) || 0
    }));
  } catch (error) {
    console.error('getLessonsWithCompletion error:', error);
    return [];
  }
}

/**
 * Gets profile course progress (lessons and exercises completed)
 * @param courseId Course ID
 * @param profileId Profile ID
 * @returns Course progress data
 */
export async function getProfileCourseProgress(courseId: string, profileId: string) {
  try {
    // Get course group
    const course = await db
      .select({
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!course[0]) {
      return {
        lessons_count: 0,
        lessons_completed: 0,
        exercises_count: 0,
        exercises_completed: 0
      };
    }

    // Get groupmember for this user
    if (!course[0].groupId) {
      return {
        lessons_count: 0,
        lessons_completed: 0,
        exercises_count: 0,
        exercises_completed: 0
      };
    }

    const groupMember = await db
      .select({
        id: schema.groupmember.id
      })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, course[0].groupId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    if (!groupMember[0]) {
      return {
        lessons_count: 0,
        lessons_completed: 0,
        exercises_count: 0,
        exercises_completed: 0
      };
    }

    // Get lessons count
    const lessonsResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    const lessonsCount = Number(lessonsResult[0]?.count || 0);

    // Get lessons completed count
    const lessonsCompletedResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.lessonCompletion.lessonId})`.as('count')
      })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          eq(schema.lessonCompletion.profileId, profileId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    const lessonsCompleted = Number(lessonsCompletedResult[0]?.count || 0);

    // Get exercises count
    const exercisesResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));

    const exercisesCount = Number(exercisesResult[0]?.count || 0);

    // Get exercises completed count
    const exercisesCompletedResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.submission.exerciseId})`.as('count')
      })
      .from(schema.submission)
      .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)),
          eq(schema.submission.submittedBy, groupMember[0].id)
        )
      );

    const exercisesCompleted = Number(exercisesCompletedResult[0]?.count || 0);

    return {
      lessons_count: lessonsCount,
      lessons_completed: lessonsCompleted,
      exercises_count: exercisesCount,
      exercises_completed: exercisesCompleted
    };
  } catch (error) {
    console.error('getProfileCourseProgress error:', error);
    return {
      lessons_count: 0,
      lessons_completed: 0,
      exercises_count: 0,
      exercises_completed: 0
    };
  }
}

// ---------------------------------------------------------------------------
// Engagement analytics — page event ingest + daily rollup upserts
// Consumed by the @cio/analytics package.
// ---------------------------------------------------------------------------

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
    return inserted.length;
  } catch (error) {
    console.error('insertPageEvents error:', error);
    throw new Error('Failed to insert page events');
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

// ---------------------------------------------------------------------------
// Read-side aggregations for dashboard analytics endpoints.
// All return rollup-derived data so reads are O(daysInRange) at most.
// ---------------------------------------------------------------------------

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
