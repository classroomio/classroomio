import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import { db } from '@db/drizzle';

export const LEARNER_INACTIVE_DAYS = 7;

/** Graded scores below this percent count as a failed attempt when the exercise sets no pass threshold. */
export const DEFAULT_FAILED_QUIZ_THRESHOLD = 50;

export type LearnerNudgeReason = 'failed_quiz' | 'inactive';

export type LearnerProgressRow = {
  courseId: string;
  courseTitle: string;
  groupMemberId: string;
  profileId: string;
  fullname: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  enrolledAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  lastActivityAt: string | null;
  needsNudge: boolean;
  nudgeReason: LearnerNudgeReason | null;
  failedExerciseId: string | null;
  failedExerciseTitle: string | null;
  failedAt: string | null;
  lastNudgedAt: string | null;
};

export type LearnerProgressSummary = {
  enrollments: number;
  learners: number;
  activeLearners: number;
  averageProgress: number;
  completedEnrollments: number;
};

function idList(ids: string[]): SQL {
  return sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `
  );
}

/**
 * One row per student enrollment in the given courses with progress (lessons complete plus exercises meeting their
 * completion policy, over every lesson and exercise), last activity (lesson progress, video progress, submissions,
 * attendance), the latest exercise failed twice without a pass, and the last nudge. `needs_nudge` marks unfinished
 * enrollments with a failed-twice exercise or no activity for {@link LEARNER_INACTIVE_DAYS} days since enrolling.
 */
function learnerProgressCte(courseIds: string[], now: Date): SQL {
  const ids = idList(courseIds);
  const nowIso = now.toISOString();

  return sql`
    taught AS (
      SELECT c.id AS course_id, c.group_id, c.title
      FROM ${schema.course} c
      WHERE c.id IN (${ids})
    ),
    lesson_totals AS (
      SELECT l.course_id, count(*)::int AS total
      FROM ${schema.lesson} l
      WHERE l.course_id IN (${ids})
      GROUP BY l.course_id
    ),
    exercise_scope AS (
      SELECT e.id, e.title, e.completion_policy, e.pass_threshold, COALESCE(e.course_id, l.course_id) AS course_id
      FROM ${schema.exercise} e
      LEFT JOIN ${schema.lesson} l ON l.id = e.lesson_id
      WHERE COALESCE(e.course_id, l.course_id) IN (${ids})
    ),
    exercise_totals AS (
      SELECT course_id, count(*)::int AS total FROM exercise_scope GROUP BY course_id
    ),
    exercise_points AS (
      SELECT q.exercise_id, SUM(q.points) AS points
      FROM ${schema.question} q
      WHERE q.exercise_id IN (SELECT id FROM exercise_scope)
      GROUP BY q.exercise_id
    ),
    members AS (
      SELECT gm.id AS group_member_id, gm.profile_id, t.course_id, t.title AS course_title,
        gm.created_at AS enrolled_at, gm.completed_at
      FROM ${schema.groupmember} gm
      JOIN taught t ON t.group_id = gm.group_id
      WHERE gm.role_id = ${ROLE.STUDENT} AND gm.profile_id IS NOT NULL
    ),
    lesson_activity AS (
      SELECT lc.profile_id, l.course_id,
        count(DISTINCT l.id) FILTER (WHERE lc.is_complete)::int AS completed,
        max(COALESCE(lc.updated_at, lc.created_at)) AS last_at
      FROM ${schema.lessonCompletion} lc
      JOIN ${schema.lesson} l ON l.id = lc.lesson_id
      WHERE l.course_id IN (${ids}) AND lc.profile_id IN (SELECT profile_id FROM members)
      GROUP BY lc.profile_id, l.course_id
    ),
    video_activity AS (
      SELECT v.profile_id, l.course_id, max(v.updated_at) AS last_at
      FROM ${schema.lessonVideoProgress} v
      JOIN ${schema.lesson} l ON l.id = v.lesson_id
      WHERE l.course_id IN (${ids}) AND v.profile_id IN (SELECT profile_id FROM members)
      GROUP BY v.profile_id, l.course_id
    ),
    scored AS (
      SELECT s.submitted_by, es.course_id, es.id AS exercise_id, s.created_at, s.grading_state,
        es.completion_policy, es.pass_threshold,
        CASE
          WHEN COALESCE(ep.points, 0) > 0 THEN ROUND((s.total::numeric / ep.points::numeric) * 100)
        END AS percent
      FROM ${schema.submission} s
      JOIN exercise_scope es ON es.id = s.exercise_id
      LEFT JOIN exercise_points ep ON ep.exercise_id = es.id
      WHERE s.submitted_by IN (SELECT group_member_id FROM members)
    ),
    submission_activity AS (
      SELECT submitted_by, course_id,
        count(DISTINCT exercise_id) FILTER (
          WHERE completion_policy != 'passed'
            OR (grading_state = 'completed' AND percent >= COALESCE(pass_threshold, 100))
        )::int AS completed,
        max(created_at) AS last_at
      FROM scored
      GROUP BY submitted_by, course_id
    ),
    failed_quiz AS (
      SELECT DISTINCT ON (submitted_by, course_id) submitted_by, course_id, exercise_id, max(created_at) AS failed_at
      FROM scored
      WHERE grading_state = 'completed' AND percent IS NOT NULL
      GROUP BY submitted_by, course_id, exercise_id, pass_threshold
      HAVING count(*) FILTER (WHERE percent < COALESCE(pass_threshold, ${DEFAULT_FAILED_QUIZ_THRESHOLD}::int)) >= 2
        AND count(*) FILTER (WHERE percent >= COALESCE(pass_threshold, ${DEFAULT_FAILED_QUIZ_THRESHOLD}::int)) = 0
      ORDER BY submitted_by, course_id, max(created_at) DESC
    ),
    attendance_activity AS (
      SELECT a.student_id, a.course_id, max(COALESCE(a.checked_in_at, a.updated_at)) AS last_at
      FROM ${schema.groupAttendance} a
      WHERE a.student_id IN (SELECT group_member_id FROM members) AND a.status IN ('present', 'late')
      GROUP BY a.student_id, a.course_id
    ),
    last_nudge AS (
      SELECT n.course_id, n.learner_profile_id, max(n.created_at) AS last_at
      FROM ${schema.learnerNudge} n
      WHERE n.course_id IN (${ids})
      GROUP BY n.course_id, n.learner_profile_id
    ),
    progress AS (
      SELECT m.course_id, m.course_title, m.group_member_id, m.profile_id, m.enrolled_at, m.completed_at,
        p.fullname, p.username, p.email, p.avatar_url,
        CASE
          WHEN COALESCE(lt.total, 0) + COALESCE(et.total, 0) = 0 THEN 0
          ELSE LEAST(100, ROUND(
            (COALESCE(la.completed, 0) + COALESCE(sa.completed, 0)) * 100.0
              / (COALESCE(lt.total, 0) + COALESCE(et.total, 0))
          ))
        END::int AS progress_percent,
        GREATEST(la.last_at, va.last_at, sa.last_at, aa.last_at) AS last_activity_at,
        fq.exercise_id AS failed_exercise_id,
        fe.title AS failed_exercise_title,
        fq.failed_at,
        ln.last_at AS last_nudged_at
      FROM members m
      JOIN ${schema.profile} p ON p.id = m.profile_id
      LEFT JOIN lesson_totals lt ON lt.course_id = m.course_id
      LEFT JOIN exercise_totals et ON et.course_id = m.course_id
      LEFT JOIN lesson_activity la ON la.profile_id = m.profile_id AND la.course_id = m.course_id
      LEFT JOIN video_activity va ON va.profile_id = m.profile_id AND va.course_id = m.course_id
      LEFT JOIN submission_activity sa ON sa.submitted_by = m.group_member_id AND sa.course_id = m.course_id
      LEFT JOIN attendance_activity aa ON aa.student_id = m.group_member_id AND aa.course_id = m.course_id
      LEFT JOIN failed_quiz fq ON fq.submitted_by = m.group_member_id AND fq.course_id = m.course_id
      LEFT JOIN exercise_scope fe ON fe.id = fq.exercise_id
      LEFT JOIN last_nudge ln ON ln.course_id = m.course_id AND ln.learner_profile_id = m.profile_id
    ),
    flagged AS (
      SELECT progress.*,
        CASE
          WHEN completed_at IS NOT NULL OR progress_percent >= 100 THEN NULL
          WHEN failed_exercise_id IS NOT NULL THEN 'failed_quiz'
          WHEN COALESCE(last_activity_at, enrolled_at, ${nowIso}::timestamptz)
            < ${nowIso}::timestamptz - make_interval(days => ${LEARNER_INACTIVE_DAYS}::int) THEN 'inactive'
        END AS nudge_reason
      FROM progress
    )
  `;
}

type RawLearnerProgressRow = {
  course_id: string;
  course_title: string;
  group_member_id: string;
  profile_id: string;
  fullname: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  enrolled_at: string | Date | null;
  completed_at: string | Date | null;
  progress_percent: number;
  last_activity_at: string | Date | null;
  failed_exercise_id: string | null;
  failed_exercise_title: string | null;
  failed_at: string | Date | null;
  last_nudged_at: string | Date | null;
  nudge_reason: LearnerNudgeReason | null;
  total_count?: number | string;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toLearnerProgressRow(row: RawLearnerProgressRow): LearnerProgressRow {
  return {
    courseId: row.course_id,
    courseTitle: row.course_title,
    groupMemberId: row.group_member_id,
    profileId: row.profile_id,
    fullname: row.fullname,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    enrolledAt: toIso(row.enrolled_at),
    completedAt: toIso(row.completed_at),
    progressPercent: Number(row.progress_percent ?? 0),
    lastActivityAt: toIso(row.last_activity_at),
    needsNudge: row.nudge_reason !== null,
    nudgeReason: row.nudge_reason,
    failedExerciseId: row.failed_exercise_id,
    failedExerciseTitle: row.failed_exercise_title,
    failedAt: toIso(row.failed_at),
    lastNudgedAt: toIso(row.last_nudged_at)
  };
}

export type ListLearnerProgressOptions = {
  courseIds: string[];
  needsNudgeOnly?: boolean;
  search?: string;
  profileId?: string;
  /** Omit for every matching row. */
  limit?: number;
  offset?: number;
  now?: Date;
};

/**
 * Student enrollments in the given courses with progress, last activity and nudge state, most in need of attention
 * first (flagged, then least recent activity). Returns the page and the total match count.
 */
export async function listLearnerProgress(
  options: ListLearnerProgressOptions
): Promise<{ rows: LearnerProgressRow[]; total: number }> {
  if (options.courseIds.length === 0) return { rows: [], total: 0 };

  try {
    const now = options.now ?? new Date();
    const searchPattern = options.search ? `%${options.search.replace(/[%_\\]/g, '\\$&')}%` : null;
    const filters: SQL[] = [sql`true`];

    if (options.needsNudgeOnly) filters.push(sql`nudge_reason IS NOT NULL`);
    if (options.profileId) filters.push(sql`profile_id = ${options.profileId}::uuid`);
    if (searchPattern) {
      filters.push(
        sql`(fullname ILIKE ${searchPattern} OR username ILIKE ${searchPattern} OR email ILIKE ${searchPattern})`
      );
    }

    const pagination = options.limit !== undefined ? sql`LIMIT ${options.limit} OFFSET ${options.offset ?? 0}` : sql``;

    const rows = await db.execute<RawLearnerProgressRow>(sql`
      WITH ${learnerProgressCte(options.courseIds, now)}
      SELECT flagged.*, count(*) OVER () AS total_count
      FROM flagged
      WHERE ${sql.join(filters, sql` AND `)}
      ORDER BY (nudge_reason IS NULL), COALESCE(last_activity_at, enrolled_at) ASC NULLS FIRST,
        fullname ASC NULLS LAST, course_title ASC
      ${pagination}
    `);

    const total = rows.length > 0 ? Number(rows[0]!.total_count ?? 0) : 0;

    return { rows: rows.map(toLearnerProgressRow), total };
  } catch (error) {
    console.error('listLearnerProgress error:', error);
    throw new Error('Failed to list learner progress');
  }
}

/**
 * Totals across the student enrollments in the given courses: enrollments, distinct learners, learners with activity
 * since `activeSince`, average progress percent and finished enrollments.
 */
export async function getLearnerProgressSummary(
  courseIds: string[],
  activeSince: Date,
  now: Date = new Date()
): Promise<LearnerProgressSummary> {
  const empty = { enrollments: 0, learners: 0, activeLearners: 0, averageProgress: 0, completedEnrollments: 0 };
  if (courseIds.length === 0) return empty;

  try {
    const [row] = await db.execute<{
      enrollments: number;
      learners: number;
      active_learners: number;
      average_progress: number | string | null;
      completed_enrollments: number;
    }>(sql`
      WITH ${learnerProgressCte(courseIds, now)}
      SELECT
        count(*)::int AS enrollments,
        count(DISTINCT profile_id)::int AS learners,
        count(DISTINCT profile_id) FILTER (WHERE last_activity_at >= ${activeSince.toISOString()}::timestamptz)::int
          AS active_learners,
        ROUND(AVG(progress_percent)) AS average_progress,
        count(*) FILTER (WHERE completed_at IS NOT NULL OR progress_percent >= 100)::int AS completed_enrollments
      FROM flagged
    `);

    if (!row) return empty;

    return {
      enrollments: Number(row.enrollments ?? 0),
      learners: Number(row.learners ?? 0),
      activeLearners: Number(row.active_learners ?? 0),
      averageProgress: Number(row.average_progress ?? 0),
      completedEnrollments: Number(row.completed_enrollments ?? 0)
    };
  } catch (error) {
    console.error('getLearnerProgressSummary error:', error);
    throw new Error('Failed to summarize learner progress');
  }
}

/** Average progress percent and student count per course. */
export async function getCourseProgressAverages(
  courseIds: string[],
  now: Date = new Date()
): Promise<Map<string, { learners: number; averageProgress: number }>> {
  if (courseIds.length === 0) return new Map();

  try {
    const rows = await db.execute<{ course_id: string; learners: number; average_progress: number | string | null }>(
      sql`
        WITH ${learnerProgressCte(courseIds, now)}
        SELECT course_id, count(*)::int AS learners, ROUND(AVG(progress_percent)) AS average_progress
        FROM flagged
        GROUP BY course_id
      `
    );

    return new Map(
      rows.map((row) => [
        row.course_id,
        { learners: Number(row.learners ?? 0), averageProgress: Number(row.average_progress ?? 0) }
      ])
    );
  } catch (error) {
    console.error('getCourseProgressAverages error:', error);
    throw new Error('Failed to average course progress');
  }
}

/** Active, non-template courses with at least one enrolled student, with their organization. */
export async function listCoursesWithStudents(): Promise<Array<{ courseId: string; organizationId: string }>> {
  try {
    const rows = await db.execute<{ course_id: string; organization_id: string }>(sql`
      SELECT c.id AS course_id, g.organization_id
      FROM ${schema.course} c
      JOIN ${schema.group} g ON g.id = c.group_id
      WHERE c.status = 'ACTIVE' AND c.is_template = false AND g.organization_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM ${schema.groupmember} gm WHERE gm.group_id = c.group_id AND gm.role_id = ${ROLE.STUDENT}
        )
      ORDER BY c.id
    `);

    return rows.map((row) => ({ courseId: row.course_id, organizationId: row.organization_id }));
  } catch (error) {
    console.error('listCoursesWithStudents error:', error);
    throw new Error('Failed to list courses with students');
  }
}
