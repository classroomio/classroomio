import * as schema from '@db/schema';

import { and, asc, eq, gt, gte, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { DEFAULT_SESSION_DURATION_MINUTES } from '@cio/utils/functions/live-session';
import { resolveCourseBannerImage } from '@cio/utils/functions';
import { courseTutorNameSql } from '../course/course-facts';

const lessonIsUnlocked = sql`${schema.lesson.isUnlocked} IS NOT FALSE`;

export type LiveClassRow = {
  lessonId: string;
  lessonTitle: string;
  lessonAt: string;
  durationMinutes: number;
  callUrl: string;
  courseId: string;
  courseTitle: string;
  courseImage: string | null;
  courseCost: number;
  courseMetadata: (typeof schema.course.$inferSelect)['metadata'];
  sessionTimezone: string | null;
  hostName: string | null;
  isRegistered: boolean;
  registeredCount: number;
};

const sessionEndsAt = sql`${schema.lesson.lessonAt} + make_interval(mins => coalesce(${schema.lesson.sessionDurationMinutes}, ${DEFAULT_SESSION_DURATION_MINUTES})::int)`;

function liveClassSelect(profileId: string) {
  return {
    lessonId: schema.lesson.id,
    lessonTitle: schema.lesson.title,
    lessonAt: schema.lesson.lessonAt,
    sessionDurationMinutes: schema.lesson.sessionDurationMinutes,
    callUrl: schema.lesson.callUrl,
    courseId: schema.course.id,
    courseTitle: schema.course.title,
    bannerImage: schema.course.bannerImage,
    logo: schema.course.logo,
    cost: schema.course.cost,
    metadata: schema.course.metadata,
    teacherName: schema.profile.fullname,
    tutorName: courseTutorNameSql(schema.course.groupId),
    isRegistered: sql<boolean>`EXISTS (
      SELECT 1 FROM ${schema.lessonSessionRegistration} AS lr
      WHERE lr.lesson_id = ${schema.lesson.id} AND lr.profile_id = ${profileId}
    )`,
    registeredCount: sql<number>`(
      SELECT COUNT(*)::int FROM ${schema.lessonSessionRegistration} AS lc WHERE lc.lesson_id = ${schema.lesson.id}
    )`
  };
}

type LiveClassSelectRow = {
  lessonId: string;
  lessonTitle: string;
  lessonAt: string | null;
  sessionDurationMinutes: number | null;
  callUrl: string | null;
  courseId: string;
  courseTitle: string;
  bannerImage: string | null;
  logo: string | null;
  cost: number | null;
  metadata: (typeof schema.course.$inferSelect)['metadata'];
  teacherName: string | null;
  tutorName: string | null;
  isRegistered: boolean;
  registeredCount: number;
};

function toLiveClassRows(rows: LiveClassSelectRow[]): LiveClassRow[] {
  return rows
    .filter((row): row is LiveClassSelectRow & { lessonAt: string; callUrl: string } =>
      Boolean(row.lessonAt && row.callUrl)
    )
    .map((row) => ({
      lessonId: row.lessonId,
      lessonTitle: row.lessonTitle,
      lessonAt: row.lessonAt,
      durationMinutes: row.sessionDurationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES,
      callUrl: row.callUrl,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      courseImage: resolveCourseBannerImage({ bannerImage: row.bannerImage, logo: row.logo }),
      courseCost: Number(row.cost ?? 0),
      courseMetadata: row.metadata,
      sessionTimezone: row.metadata?.sessionTimezone ?? null,
      hostName: row.teacherName || row.tutorName || null,
      isRegistered: Boolean(row.isRegistered),
      registeredCount: Number(row.registeredCount)
    }));
}

/** Scheduled live classes in the given courses that have not ended yet, soonest first. */
export async function listLiveClassesInCourses(params: {
  courseIds: string[];
  profileId: string;
  limit: number;
}): Promise<LiveClassRow[]> {
  if (params.courseIds.length === 0) return [];

  try {
    const rows = await db
      .select(liveClassSelect(params.profileId))
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .leftJoin(schema.profile, eq(schema.profile.id, schema.lesson.teacherId))
      .where(
        and(
          inArray(schema.lesson.courseId, params.courseIds),
          lessonIsUnlocked,
          isNotNull(schema.lesson.callUrl),
          isNotNull(schema.lesson.lessonAt),
          sql`${sessionEndsAt} > now()`
        )
      )
      .orderBy(asc(schema.lesson.lessonAt))
      .limit(params.limit);

    return toLiveClassRows(rows);
  } catch (error) {
    console.error('listLiveClassesInCourses error:', error);
    throw new Error('Failed to list live classes');
  }
}

/**
 * Upcoming live classes in the organization's published catalog courses the learner is not a member of and may
 * join themselves, soonest first. Paid courses are included; the service decides what can be joined in the app.
 */
export async function listCatalogLiveClasses(params: {
  orgId: string;
  profileId: string;
  limit: number;
}): Promise<LiveClassRow[]> {
  try {
    const rows = await db
      .select(liveClassSelect(params.profileId))
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .leftJoin(schema.profile, eq(schema.profile.id, schema.lesson.teacherId))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.profileId, params.profileId))
      )
      .where(
        and(
          eq(schema.group.organizationId, params.orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.course.isTemplate, false),
          isNull(schema.groupmember.id),
          sql`COALESCE(${schema.course.metadata}->>'allowSelfEnrollment', ${schema.course.metadata}->>'allowNewStudent', 'true') != 'false'`,
          lessonIsUnlocked,
          isNotNull(schema.lesson.callUrl),
          isNotNull(schema.lesson.lessonAt),
          gt(schema.lesson.lessonAt, sql`now()`)
        )
      )
      .orderBy(asc(schema.lesson.lessonAt))
      .limit(params.limit);

    return toLiveClassRows(rows);
  } catch (error) {
    console.error('listCatalogLiveClasses error:', error);
    throw new Error('Failed to list catalog live classes');
  }
}

export type LiveClassLesson = {
  lessonId: string;
  lessonAt: string | null;
  callUrl: string | null;
  sessionDurationMinutes: number | null;
  courseId: string;
  organizationId: string | null;
  isUnlocked: boolean;
};

export async function getLiveClassLesson(lessonId: string): Promise<LiveClassLesson | null> {
  try {
    const [row] = await db
      .select({
        lessonId: schema.lesson.id,
        lessonAt: schema.lesson.lessonAt,
        callUrl: schema.lesson.callUrl,
        sessionDurationMinutes: schema.lesson.sessionDurationMinutes,
        courseId: schema.course.id,
        organizationId: schema.group.organizationId,
        isUnlocked: sql<boolean>`${lessonIsUnlocked}`
      })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(eq(schema.lesson.id, lessonId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLiveClassLesson error:', error);
    throw new Error('Failed to load live class');
  }
}

export async function insertLiveClassRegistration(
  lessonId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .insert(schema.lessonSessionRegistration)
      .values({ lessonId, profileId })
      .onConflictDoNothing({
        target: [schema.lessonSessionRegistration.lessonId, schema.lessonSessionRegistration.profileId]
      });
  } catch (error) {
    console.error('insertLiveClassRegistration error:', error);
    throw new Error('Failed to register for live class');
  }
}

export async function deleteLiveClassRegistration(lessonId: string, profileId: string): Promise<void> {
  try {
    await db
      .delete(schema.lessonSessionRegistration)
      .where(
        and(
          eq(schema.lessonSessionRegistration.lessonId, lessonId),
          eq(schema.lessonSessionRegistration.profileId, profileId)
        )
      );
  } catch (error) {
    console.error('deleteLiveClassRegistration error:', error);
    throw new Error('Failed to cancel live class registration');
  }
}

export async function countLiveClassRegistrations(lessonId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(schema.lessonSessionRegistration)
      .where(eq(schema.lessonSessionRegistration.lessonId, lessonId));

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countLiveClassRegistrations error:', error);
    throw new Error('Failed to count live class registrations');
  }
}

export type RegisteredLearnerRow = {
  lessonId: string;
  lessonAt: string;
  profileId: string;
  courseId: string;
  organizationId: string;
};

/**
 * Registered learners of unlocked live classes on published, active courses starting between `from` and `until`,
 * who are still members of the course.
 */
export async function listRegisteredLearnersStartingBetween(from: Date, until: Date): Promise<RegisteredLearnerRow[]> {
  try {
    const rows = await db
      .select({
        lessonId: schema.lesson.id,
        lessonAt: schema.lesson.lessonAt,
        profileId: schema.lessonSessionRegistration.profileId,
        courseId: schema.course.id,
        organizationId: schema.group.organizationId
      })
      .from(schema.lessonSessionRegistration)
      .innerJoin(schema.lesson, eq(schema.lesson.id, schema.lessonSessionRegistration.lessonId))
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .innerJoin(
        schema.groupmember,
        and(
          eq(schema.groupmember.groupId, schema.course.groupId),
          eq(schema.groupmember.profileId, schema.lessonSessionRegistration.profileId)
        )
      )
      .where(
        and(
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          lessonIsUnlocked,
          isNotNull(schema.lesson.callUrl),
          gte(schema.lesson.lessonAt, from.toISOString()),
          lt(schema.lesson.lessonAt, until.toISOString())
        )
      );

    return rows.filter((row): row is RegisteredLearnerRow => Boolean(row.lessonAt && row.organizationId));
  } catch (error) {
    console.error('listRegisteredLearnersStartingBetween error:', error);
    throw new Error('Failed to list registered learners');
  }
}
