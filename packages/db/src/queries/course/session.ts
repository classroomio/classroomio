import * as schema from '@db/schema';

import { and, eq, gt, inArray, isNotNull, lt } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

export type UpcomingSessionReminderRow = {
  courseId: string;
  courseName: string;
  sessionTimezone: string | null;
  lessonId: string;
  lessonTitle: string;
  lessonAt: string;
  callUrl: string;
  profileId: string;
  email: string | null;
  organizationId: string;
  organizationName: string;
  organizationSiteName: string | null;
  organizationCustomDomain: string | null;
  organizationIsCustomDomainVerified: boolean | null;
  organizationAvatarUrl: string | null;
  organizationTheme: string | null;
};

/**
 * Lessons that are live sessions (have a `callUrl`) starting within the next
 * ~25h, on a published/active LIVE_CLASS course, joined to each enrolled
 * student + org branding. One row per (session × student) for the reminder scan.
 */
export async function listUpcomingSessionsForReminderScan(): Promise<UpcomingSessionReminderRow[]> {
  try {
    const now = new Date();
    const horizon = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const result = await db
      .select({
        courseId: schema.course.id,
        courseName: schema.course.title,
        courseMetadata: schema.course.metadata,
        lessonId: schema.lesson.id,
        lessonTitle: schema.lesson.title,
        lessonAt: schema.lesson.lessonAt,
        callUrl: schema.lesson.callUrl,
        profileId: schema.groupmember.profileId,
        email: schema.profile.email,
        organizationId: schema.organization.id,
        organizationName: schema.organization.name,
        organizationSiteName: schema.organization.siteName,
        organizationCustomDomain: schema.organization.customDomain,
        organizationIsCustomDomainVerified: schema.organization.isCustomDomainVerified,
        organizationAvatarUrl: schema.organization.avatarUrl,
        organizationTheme: schema.organization.theme
      })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .innerJoin(schema.groupmember, eq(schema.groupmember.groupId, schema.group.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.course.type, 'LIVE_CLASS'),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.groupmember.roleId, ROLE.STUDENT),
          isNotNull(schema.lesson.callUrl),
          isNotNull(schema.lesson.lessonAt),
          gt(schema.lesson.lessonAt, now.toISOString()),
          lt(schema.lesson.lessonAt, horizon.toISOString())
        )
      );

    return result
      .filter((row) => row.profileId && row.lessonAt && row.callUrl)
      .map((row) => ({
        courseId: row.courseId,
        courseName: row.courseName,
        sessionTimezone: row.courseMetadata?.sessionTimezone ?? null,
        lessonId: row.lessonId,
        lessonTitle: row.lessonTitle,
        lessonAt: row.lessonAt!,
        callUrl: row.callUrl!,
        profileId: row.profileId!,
        email: row.email,
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        organizationSiteName: row.organizationSiteName,
        organizationCustomDomain: row.organizationCustomDomain,
        organizationIsCustomDomainVerified: row.organizationIsCustomDomainVerified,
        organizationAvatarUrl: row.organizationAvatarUrl,
        organizationTheme: row.organizationTheme
      }));
  } catch (error) {
    console.error('listUpcomingSessionsForReminderScan error:', error);
    throw new Error(
      `Failed to list upcoming sessions for reminder scan: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type CourseUpcomingSession = {
  lessonId: string;
  lessonTitle: string;
  callUrl: string;
  lessonAt: string;
  sessionTimezone: string | null;
};

/**
 * The next upcoming live session (earliest future lesson with a `callUrl`) for
 * each of the given course ids. Used to show a "Join session" button on /lms.
 */
export async function getUpcomingSessionsForCourseIds(
  courseIds: string[]
): Promise<Map<string, CourseUpcomingSession>> {
  try {
    if (courseIds.length === 0) return new Map();

    const now = new Date().toISOString();

    const rows = await db
      .select({
        courseId: schema.lesson.courseId,
        courseMetadata: schema.course.metadata,
        lessonId: schema.lesson.id,
        lessonTitle: schema.lesson.title,
        callUrl: schema.lesson.callUrl,
        lessonAt: schema.lesson.lessonAt
      })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .where(
        and(
          inArray(schema.lesson.courseId, courseIds),
          isNotNull(schema.lesson.callUrl),
          isNotNull(schema.lesson.lessonAt),
          gt(schema.lesson.lessonAt, now)
        )
      )
      .orderBy(schema.lesson.lessonAt);

    const byCourse = new Map<string, CourseUpcomingSession>();
    for (const row of rows) {
      if (!row.callUrl || !row.lessonAt) continue;
      // rows are ascending by lessonAt; keep the first (earliest) per course.
      if (byCourse.has(row.courseId)) continue;

      byCourse.set(row.courseId, {
        lessonId: row.lessonId,
        lessonTitle: row.lessonTitle,
        callUrl: row.callUrl,
        lessonAt: row.lessonAt,
        sessionTimezone: row.courseMetadata?.sessionTimezone ?? null
      });
    }

    return byCourse;
  } catch (error) {
    console.error('getUpcomingSessionsForCourseIds error:', error);
    throw new Error(`Failed to get upcoming sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
