import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import { DEFAULT_SESSION_DURATION_MINUTES } from '@cio/utils/functions/live-session';
import { db } from '@db/drizzle';

export type TeachingSessionRow = {
  lessonId: string;
  title: string;
  lessonAt: string;
  durationMinutes: number;
  callUrl: string | null;
  courseId: string;
  courseTitle: string;
  host: { id: string; fullname: string | null; avatarUrl: string | null } | null;
  registeredCount: number;
  studentCount: number;
  attendanceMarked: number;
};

export type StaffSessionRow = {
  lessonId: string;
  courseId: string;
  organizationId: string;
  hostProfileId: string | null;
  lessonAt: string;
};

function idList(ids: string[]): SQL {
  return sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `
  );
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

const sessionEnd = sql`l.lesson_at + make_interval(mins => COALESCE(l.session_duration_minutes, ${DEFAULT_SESSION_DURATION_MINUTES}::int))`;

/**
 * Live sessions (lessons with a start time) in the given courses that have not ended yet, soonest first, with the
 * host, registered learners, enrolled students and attendance marks recorded so far.
 */
export async function listTeachingSessions(options: {
  courseIds: string[];
  limit: number;
  now?: Date;
}): Promise<TeachingSessionRow[]> {
  if (options.courseIds.length === 0) return [];

  try {
    const nowIso = (options.now ?? new Date()).toISOString();
    const rows = await db.execute<{
      lesson_id: string;
      title: string;
      lesson_at: string | Date;
      duration_minutes: number;
      call_url: string | null;
      course_id: string;
      course_title: string;
      host_id: string | null;
      host_fullname: string | null;
      host_avatar_url: string | null;
      registered_count: number;
      student_count: number;
      attendance_marked: number;
    }>(sql`
      SELECT l.id AS lesson_id, l.title, l.lesson_at,
        COALESCE(l.session_duration_minutes, ${DEFAULT_SESSION_DURATION_MINUTES}::int)::int AS duration_minutes,
        l.call_url, c.id AS course_id, c.title AS course_title,
        host.id AS host_id, host.fullname AS host_fullname, host.avatar_url AS host_avatar_url,
        (SELECT count(*) FROM ${schema.lessonSessionRegistration} r WHERE r.lesson_id = l.id)::int AS registered_count,
        (SELECT count(*) FROM ${schema.groupmember} gm
          WHERE gm.group_id = c.group_id AND gm.role_id = ${ROLE.STUDENT})::int AS student_count,
        (SELECT count(*) FROM ${schema.groupAttendance} a WHERE a.lesson_id = l.id)::int AS attendance_marked
      FROM ${schema.lesson} l
      JOIN ${schema.course} c ON c.id = l.course_id
      LEFT JOIN ${schema.profile} host ON host.id = l.teacher_id
      WHERE l.course_id IN (${idList(options.courseIds)})
        AND l.lesson_at IS NOT NULL
        AND ${sessionEnd} > ${nowIso}::timestamptz
      ORDER BY l.lesson_at ASC, l.id ASC
      LIMIT ${options.limit}
    `);

    return rows.map((row) => ({
      lessonId: row.lesson_id,
      title: row.title,
      lessonAt: toIso(row.lesson_at),
      durationMinutes: Number(row.duration_minutes),
      callUrl: row.call_url,
      courseId: row.course_id,
      courseTitle: row.course_title,
      host: row.host_id ? { id: row.host_id, fullname: row.host_fullname, avatarUrl: row.host_avatar_url } : null,
      registeredCount: Number(row.registered_count ?? 0),
      studentCount: Number(row.student_count ?? 0),
      attendanceMarked: Number(row.attendance_marked ?? 0)
    }));
  } catch (error) {
    console.error('listTeachingSessions error:', error);
    throw new Error('Failed to list teaching sessions');
  }
}

/** Sessions on active courses starting after `now` and no later than `until`. */
export async function listSessionsStartingBetween(now: Date, until: Date): Promise<StaffSessionRow[]> {
  try {
    const rows = await db.execute<{
      lesson_id: string;
      course_id: string;
      organization_id: string;
      teacher_id: string | null;
      lesson_at: string | Date;
    }>(sql`
      SELECT l.id AS lesson_id, c.id AS course_id, g.organization_id, l.teacher_id, l.lesson_at
      FROM ${schema.lesson} l
      JOIN ${schema.course} c ON c.id = l.course_id
      JOIN ${schema.group} g ON g.id = c.group_id
      WHERE c.status = 'ACTIVE' AND c.is_template = false AND g.organization_id IS NOT NULL
        AND l.lesson_at > ${now.toISOString()}::timestamptz
        AND l.lesson_at <= ${until.toISOString()}::timestamptz
    `);

    return rows.map((row) => ({
      lessonId: row.lesson_id,
      courseId: row.course_id,
      organizationId: row.organization_id,
      hostProfileId: row.teacher_id,
      lessonAt: toIso(row.lesson_at)
    }));
  } catch (error) {
    console.error('listSessionsStartingBetween error:', error);
    throw new Error('Failed to list sessions starting soon');
  }
}

/**
 * Sessions on active courses with enrolled students that ended between `endedAfter` and `now` and have no attendance
 * recorded for any student.
 */
export async function listEndedSessionsWithoutAttendance(now: Date, endedAfter: Date): Promise<StaffSessionRow[]> {
  try {
    const rows = await db.execute<{
      lesson_id: string;
      course_id: string;
      organization_id: string;
      teacher_id: string | null;
      lesson_at: string | Date;
    }>(sql`
      SELECT l.id AS lesson_id, c.id AS course_id, g.organization_id, l.teacher_id, l.lesson_at
      FROM ${schema.lesson} l
      JOIN ${schema.course} c ON c.id = l.course_id
      JOIN ${schema.group} g ON g.id = c.group_id
      WHERE c.status = 'ACTIVE' AND c.is_template = false AND g.organization_id IS NOT NULL
        AND l.lesson_at IS NOT NULL
        AND ${sessionEnd} <= ${now.toISOString()}::timestamptz
        AND ${sessionEnd} > ${endedAfter.toISOString()}::timestamptz
        AND EXISTS (
          SELECT 1 FROM ${schema.groupmember} gm WHERE gm.group_id = c.group_id AND gm.role_id = ${ROLE.STUDENT}
        )
        AND NOT EXISTS (SELECT 1 FROM ${schema.groupAttendance} a WHERE a.lesson_id = l.id)
    `);

    return rows.map((row) => ({
      lessonId: row.lesson_id,
      courseId: row.course_id,
      organizationId: row.organization_id,
      hostProfileId: row.teacher_id,
      lessonAt: toIso(row.lesson_at)
    }));
  } catch (error) {
    console.error('listEndedSessionsWithoutAttendance error:', error);
    throw new Error('Failed to list sessions without attendance');
  }
}

/**
 * Course team members (course ADMIN or TUTOR) whose active organization role is TUTOR, keyed by course id. Org
 * admins get the admin notification set instead, so they are left out.
 */
export async function listCourseTutorProfileIds(courseIds: string[]): Promise<Map<string, string[]>> {
  const ids = [...new Set(courseIds)];
  if (ids.length === 0) return new Map();

  try {
    const rows = await db.execute<{ course_id: string; profile_id: string }>(sql`
      SELECT DISTINCT c.id AS course_id, gm.profile_id
      FROM ${schema.course} c
      JOIN ${schema.group} g ON g.id = c.group_id
      JOIN ${schema.groupmember} gm ON gm.group_id = c.group_id AND gm.role_id IN (${ROLE.ADMIN}, ${ROLE.TUTOR})
      JOIN ${schema.organizationmember} om
        ON om.organization_id = g.organization_id AND om.profile_id = gm.profile_id
      WHERE c.id IN (${idList(ids)}) AND gm.profile_id IS NOT NULL
        AND om.role_id = ${ROLE.TUTOR} AND om.status = 'ACTIVE'
    `);

    const byCourse = new Map<string, string[]>();
    for (const row of rows) {
      byCourse.set(row.course_id, [...(byCourse.get(row.course_id) ?? []), row.profile_id]);
    }

    return byCourse;
  } catch (error) {
    console.error('listCourseTutorProfileIds error:', error);
    throw new Error('Failed to list course tutors');
  }
}
