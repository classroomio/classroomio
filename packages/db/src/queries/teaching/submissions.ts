import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import { db } from '@db/drizzle';

export type UpcomingExerciseRow = {
  exerciseId: string;
  title: string;
  dueBy: string;
  courseId: string;
  courseTitle: string;
  submittedCount: number;
  studentCount: number;
};

export type GradedSubmissionRow = {
  id: string;
  courseId: string;
  courseTitle: string;
  exerciseId: string;
  exerciseTitle: string;
  student: { id: string; fullname: string | null; username: string | null; avatarUrl: string | null } | null;
  total: number;
  maxPoints: number;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  gradedBy: { id: string; fullname: string | null } | null;
};

function idList(ids: string[]): SQL {
  return sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `
  );
}

function toIso(value: string | Date | null): string | null {
  if (!value) return null;

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** `exercise.due_by` is stored without a time zone; read it as UTC, as the API's server clock does. */
function dueByIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();

  return new Date(`${value.replace(' ', 'T')}${/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? '' : 'Z'}`).toISOString();
}

/**
 * Exercises in the given courses due after `now`, soonest first, with how many enrolled students have submitted.
 */
export async function listUpcomingExercises(options: {
  courseIds: string[];
  limit: number;
  now?: Date;
}): Promise<UpcomingExerciseRow[]> {
  if (options.courseIds.length === 0) return [];

  try {
    const nowIso = (options.now ?? new Date()).toISOString();
    const rows = await db.execute<{
      exercise_id: string;
      title: string;
      due_by: string | Date;
      course_id: string;
      course_title: string;
      submitted_count: number;
      student_count: number;
    }>(sql`
      WITH scoped AS (
        SELECT e.id, e.title, e.due_by, COALESCE(e.course_id, l.course_id) AS course_id
        FROM ${schema.exercise} e
        LEFT JOIN ${schema.lesson} l ON l.id = e.lesson_id
        WHERE COALESCE(e.course_id, l.course_id) IN (${idList(options.courseIds)})
          AND e.due_by IS NOT NULL
          AND e.due_by > (${nowIso}::timestamptz AT TIME ZONE 'UTC')
      )
      SELECT scoped.id AS exercise_id, scoped.title, scoped.due_by, c.id AS course_id, c.title AS course_title,
        (SELECT count(DISTINCT s.submitted_by) FROM ${schema.submission} s
          JOIN ${schema.groupmember} sgm ON sgm.id = s.submitted_by AND sgm.role_id = ${ROLE.STUDENT}
          WHERE s.exercise_id = scoped.id)::int AS submitted_count,
        (SELECT count(*) FROM ${schema.groupmember} gm
          WHERE gm.group_id = c.group_id AND gm.role_id = ${ROLE.STUDENT})::int AS student_count
      FROM scoped
      JOIN ${schema.course} c ON c.id = scoped.course_id
      ORDER BY scoped.due_by ASC, scoped.id ASC
      LIMIT ${options.limit}
    `);

    return rows.map((row) => ({
      exerciseId: row.exercise_id,
      title: row.title,
      dueBy: dueByIso(row.due_by),
      courseId: row.course_id,
      courseTitle: row.course_title,
      submittedCount: Number(row.submitted_count ?? 0),
      studentCount: Number(row.student_count ?? 0)
    }));
  } catch (error) {
    console.error('listUpcomingExercises error:', error);
    throw new Error('Failed to list upcoming exercises');
  }
}

/** Graded submissions in the given courses, most recently graded first, with the total match count. */
export async function listGradedSubmissions(options: {
  courseIds: string[];
  limit: number;
  offset: number;
}): Promise<{ rows: GradedSubmissionRow[]; total: number }> {
  if (options.courseIds.length === 0) return { rows: [], total: 0 };

  try {
    const rows = await db.execute<{
      id: string;
      course_id: string;
      course_title: string;
      exercise_id: string;
      exercise_title: string;
      student_id: string | null;
      student_fullname: string | null;
      student_username: string | null;
      student_avatar_url: string | null;
      total: number | string | null;
      max_points: number | string | null;
      feedback: string | null;
      submitted_at: string | Date | null;
      graded_at: string | Date | null;
      grader_id: string | null;
      grader_fullname: string | null;
      total_count: number | string;
    }>(sql`
      SELECT s.id, c.id AS course_id, c.title AS course_title, e.id AS exercise_id, e.title AS exercise_title,
        student.id AS student_id, student.fullname AS student_fullname, student.username AS student_username,
        student.avatar_url AS student_avatar_url, s.total,
        (SELECT COALESCE(SUM(q.points), 0) FROM ${schema.question} q WHERE q.exercise_id = e.id) AS max_points,
        s.feedback, s.created_at AS submitted_at, s.updated_at AS graded_at,
        grader.id AS grader_id, grader.fullname AS grader_fullname,
        count(*) OVER () AS total_count
      FROM ${schema.submission} s
      JOIN ${schema.course} c ON c.id = s.course_id
      JOIN ${schema.exercise} e ON e.id = s.exercise_id
      LEFT JOIN ${schema.groupmember} gm ON gm.id = s.submitted_by
      LEFT JOIN ${schema.profile} student ON student.id = gm.profile_id
      LEFT JOIN ${schema.profile} grader ON grader.id = s.graded_by
      WHERE s.course_id IN (${idList(options.courseIds)}) AND s.grading_state = 'completed'
      ORDER BY s.updated_at DESC NULLS LAST, s.id DESC
      LIMIT ${options.limit} OFFSET ${options.offset}
    `);

    const total = rows.length > 0 ? Number(rows[0]!.total_count ?? 0) : 0;

    return {
      total,
      rows: rows.map((row) => ({
        id: row.id,
        courseId: row.course_id,
        courseTitle: row.course_title,
        exerciseId: row.exercise_id,
        exerciseTitle: row.exercise_title,
        student: row.student_id
          ? {
              id: row.student_id,
              fullname: row.student_fullname,
              username: row.student_username,
              avatarUrl: row.student_avatar_url
            }
          : null,
        total: Number(row.total ?? 0),
        maxPoints: Number(row.max_points ?? 0),
        feedback: row.feedback,
        submittedAt: toIso(row.submitted_at),
        gradedAt: toIso(row.graded_at),
        gradedBy: row.grader_id ? { id: row.grader_id, fullname: row.grader_fullname } : null
      }))
    };
  } catch (error) {
    console.error('listGradedSubmissions error:', error);
    throw new Error('Failed to list graded submissions');
  }
}

/** Average score percent of graded submissions in the given courses whose exercise is worth points, or null. */
export async function getAverageGradedScore(courseIds: string[]): Promise<number | null> {
  if (courseIds.length === 0) return null;

  try {
    const [row] = await db.execute<{ average: number | string | null }>(sql`
      WITH graded AS (
        SELECT s.total, (SELECT SUM(q.points) FROM ${schema.question} q WHERE q.exercise_id = s.exercise_id) AS points
        FROM ${schema.submission} s
        WHERE s.course_id IN (${idList(courseIds)}) AND s.grading_state = 'completed'
      )
      SELECT ROUND(AVG(LEAST(100, (total::numeric / points::numeric) * 100))) AS average
      FROM graded
      WHERE points > 0
    `);

    return row?.average === null || row?.average === undefined ? null : Number(row.average);
  } catch (error) {
    console.error('getAverageGradedScore error:', error);
    throw new Error('Failed to average graded scores');
  }
}

/** Ungraded submissions in the given courses. */
export async function countUngradedSubmissions(courseIds: string[]): Promise<number> {
  if (courseIds.length === 0) return 0;

  try {
    const [row] = await db.execute<{ total: number }>(sql`
      SELECT count(*)::int AS total FROM ${schema.submission} s
      WHERE s.course_id IN (${idList(courseIds)}) AND s.grading_state != 'completed'
    `);

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countUngradedSubmissions error:', error);
    throw new Error('Failed to count ungraded submissions');
  }
}
