import {
  analyticsLoginEvents,
  and,
  course,
  dashOrgStats,
  db,
  desc,
  eq,
  gte,
  group,
  groupmember,
  isNotNull,
  lesson,
  lessonCompletion,
  organizationmember,
  profile,
  sql
} from '@db/drizzle';

import { ROLE } from '@cio/utils/constants';

export function getCourseStats(orgId: string) {
  const subquery = db
    .select({
      courseId: course.id,
      courseTitle: course.title,
      totalStudents: sql<number>`COUNT(DISTINCT ${groupmember.id})`.as('total_students'),
      totalLessons: sql<number>`COUNT(DISTINCT ${lesson.id})`.as('total_lessons'),
      completedLessons: sql<number>`
        COUNT(DISTINCT ${lessonCompletion.id}) 
        FILTER (WHERE ${lessonCompletion.isComplete} = true)
      `.as('completed_lessons'),
      certificatesEarned: sql<number>`
        COUNT(DISTINCT ${groupmember.id})
        FILTER (WHERE ${groupmember.certificateEarnedAt} IS NOT NULL)
      `.as('certificates_earned')
    })
    .from(course)
    .innerJoin(group, eq(group.id, course.groupId))
    .leftJoin(groupmember, and(eq(groupmember.groupId, group.id), eq(groupmember.roleId, 3)))
    .leftJoin(lesson, eq(lesson.courseId, course.id))
    .leftJoin(
      lessonCompletion,
      and(eq(lessonCompletion.lessonId, lesson.id), eq(lessonCompletion.profileId, groupmember.profileId))
    )
    .where(and(eq(course.status, 'ACTIVE'), eq(group.organizationId, orgId)))
    .groupBy(course.id, course.title)
    .orderBy(sql`completed_lessons DESC`)
    .as('course_stats');

  return db
    .select({
      courseId: subquery.courseId,
      courseTitle: subquery.courseTitle,
      totalStudents: sql<number>`${subquery.totalStudents}::integer`,
      completionPercentage: sql<number>`
        CASE 
          WHEN ${subquery.totalStudents} * ${subquery.totalLessons} = 0 THEN 0
          ELSE ROUND((${subquery.completedLessons}::numeric / (${subquery.totalStudents} * ${subquery.totalLessons})) * 100)::integer
        END
      `,
      certificationPercentage: sql<number>`
        CASE
          WHEN ${subquery.totalStudents} = 0 THEN 0
          ELSE ROUND((${subquery.certificatesEarned}::numeric / ${subquery.totalStudents}) * 100)::integer
        END
      `
    })
    .from(subquery)
    .orderBy(subquery.completedLessons)
    .limit(5);
}

export function getRecentEnrollments(orgId: string) {
  return db
    .select({
      profileId: profile.id,
      avatarUrl: profile.avatarUrl,
      fullname: profile.fullname,
      courseId: course.id,
      courseTitle: course.title,
      enrolledAt: groupmember.createdAt
    })
    .from(course)
    .innerJoin(group, eq(group.id, course.groupId))
    .leftJoin(groupmember, and(eq(groupmember.groupId, group.id), eq(groupmember.roleId, 3)))
    .innerJoin(profile, eq(profile.id, groupmember.profileId))
    .where(and(eq(course.status, 'ACTIVE'), eq(group.organizationId, orgId)))
    .groupBy(profile.id, course.id, course.title, groupmember.createdAt)
    .orderBy(desc(groupmember.createdAt))
    .limit(5);
}

/** Count of student enrollments that have earned a certificate (per org, active courses). */
export function getTotalCertificatesIssued(orgId: string) {
  return db
    .select({
      count: sql<number>`count(${groupmember.id})::int`
    })
    .from(groupmember)
    .innerJoin(group, eq(groupmember.groupId, group.id))
    .innerJoin(course, eq(course.groupId, group.id))
    .where(
      and(
        eq(group.organizationId, orgId),
        eq(course.status, 'ACTIVE'),
        eq(groupmember.roleId, 3),
        isNotNull(groupmember.certificateEarnedAt)
      )
    );
}

/** Most recent certificate earners for the org dashboard. */
export function getRecentCertifications(orgId: string) {
  return db
    .select({
      profileId: profile.id,
      avatarUrl: profile.avatarUrl,
      fullname: profile.fullname,
      courseId: course.id,
      courseTitle: course.title,
      earnedAt: groupmember.certificateEarnedAt
    })
    .from(groupmember)
    .innerJoin(group, eq(groupmember.groupId, group.id))
    .innerJoin(course, eq(course.groupId, group.id))
    .innerJoin(profile, eq(profile.id, groupmember.profileId))
    .where(
      and(
        eq(group.organizationId, orgId),
        eq(course.status, 'ACTIVE'),
        eq(groupmember.roleId, 3),
        isNotNull(groupmember.certificateEarnedAt)
      )
    )
    .orderBy(desc(groupmember.certificateEarnedAt))
    .limit(5);
}

export function getDashOrgStats(orgId: string) {
  return db.select().from(dashOrgStats).where(eq(dashOrgStats.orgId, orgId));
}

/**
 * Returns login counts grouped by day-of-week (0 = Sunday … 6 = Saturday) for
 * students of the given organization over the last `days` days.
 *
 * Each row in analytics_login_events is already one-per-user-per-day, so the
 * counts represent distinct active students per weekday — the chart shows
 * "most active day," not raw login volume.
 */
export function getOrgStudentLoginsByDayOfWeek(orgId: string, days: number) {
  const since = sql`CURRENT_DATE - ${sql.raw(`${days}`)}::int`;

  return db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${analyticsLoginEvents.loggedInDate})::int`.as('day_of_week'),
      count: sql<number>`COUNT(*)::int`.as('count')
    })
    .from(analyticsLoginEvents)
    .innerJoin(organizationmember, eq(organizationmember.profileId, analyticsLoginEvents.userId))
    .where(
      and(
        eq(organizationmember.organizationId, orgId),
        eq(organizationmember.roleId, ROLE.STUDENT),
        gte(analyticsLoginEvents.loggedInDate, since)
      )
    )
    .groupBy(sql`day_of_week`)
    .orderBy(sql`day_of_week`);
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getUserLoginStreak(userId: string) {
  const rows = await db
    .select({
      loggedInDate: analyticsLoginEvents.loggedInDate
    })
    .from(analyticsLoginEvents)
    .where(eq(analyticsLoginEvents.userId, userId))
    .orderBy(desc(analyticsLoginEvents.loggedInDate))
    .limit(90);

  const loggedInDates = new Set(rows.map((row) => row.loggedInDate));
  const cursorDate = new Date();

  if (!loggedInDates.has(getDateKey(cursorDate))) {
    cursorDate.setDate(cursorDate.getDate() - 1);
  }

  let daysActive = 0;
  while (loggedInDates.has(getDateKey(cursorDate))) {
    daysActive += 1;
    cursorDate.setDate(cursorDate.getDate() - 1);
  }

  return { daysActive };
}
