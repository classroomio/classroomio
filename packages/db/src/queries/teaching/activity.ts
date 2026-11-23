import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import { db } from '@db/drizzle';

export const LEARNER_ACTIVITY_KINDS = [
  'enrolled',
  'lesson_completed',
  'exercise_submitted',
  'course_completed'
] as const;

export type LearnerActivityKind = (typeof LEARNER_ACTIVITY_KINDS)[number];

export type LearnerActivityRow = {
  id: string;
  kind: LearnerActivityKind;
  occurredAt: string;
  courseId: string;
  courseTitle: string;
  learner: { id: string; fullname: string | null; username: string | null; avatarUrl: string | null };
  subjectId: string | null;
  subjectTitle: string | null;
};

type RawActivityRow = {
  id: string;
  kind: LearnerActivityKind;
  occurred_at: string | Date;
  course_id: string;
  course_title: string;
  profile_id: string;
  fullname: string | null;
  username: string | null;
  avatar_url: string | null;
  subject_id: string | null;
  subject_title: string | null;
};

function idList(ids: string[]): SQL {
  return sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `
  );
}

export type LearnerActivityCursor = { occurredAt: string; id: string };

/**
 * Student events in the given courses, newest first: enrollments, lesson completions, exercise submissions and course
 * completions. `after` continues from the last event of the previous page.
 */
export async function listLearnerActivity(options: {
  courseIds: string[];
  limit: number;
  after?: LearnerActivityCursor;
}): Promise<LearnerActivityRow[]> {
  if (options.courseIds.length === 0) return [];

  try {
    const ids = idList(options.courseIds);
    const before = options.after
      ? sql`AND (date_trunc('milliseconds', events.occurred_at), events.id)
          < (${options.after.occurredAt}::timestamptz, ${options.after.id})`
      : sql``;

    const rows = await db.execute<RawActivityRow>(sql`
      WITH taught AS (
        SELECT c.id AS course_id, c.group_id, c.title FROM ${schema.course} c WHERE c.id IN (${ids})
      ),
      events AS (
        SELECT 'enrolled:' || gm.id AS id, 'enrolled' AS kind, gm.created_at AS occurred_at, t.course_id,
          t.title AS course_title, gm.profile_id, NULL::text AS subject_id, NULL::text AS subject_title
        FROM ${schema.groupmember} gm
        JOIN taught t ON t.group_id = gm.group_id
        WHERE gm.role_id = ${ROLE.STUDENT} AND gm.profile_id IS NOT NULL AND gm.created_at IS NOT NULL
        UNION ALL
        SELECT 'course_completed:' || gm.id, 'course_completed', gm.completed_at, t.course_id, t.title, gm.profile_id,
          NULL, NULL
        FROM ${schema.groupmember} gm
        JOIN taught t ON t.group_id = gm.group_id
        WHERE gm.role_id = ${ROLE.STUDENT} AND gm.profile_id IS NOT NULL AND gm.completed_at IS NOT NULL
        UNION ALL
        SELECT 'lesson_completed:' || lc.id, 'lesson_completed', COALESCE(lc.updated_at, lc.created_at), t.course_id,
          t.title, lc.profile_id, l.id::text, l.title
        FROM ${schema.lessonCompletion} lc
        JOIN ${schema.lesson} l ON l.id = lc.lesson_id
        JOIN taught t ON t.course_id = l.course_id
        JOIN ${schema.groupmember} gm
          ON gm.group_id = t.group_id AND gm.profile_id = lc.profile_id AND gm.role_id = ${ROLE.STUDENT}
        WHERE lc.is_complete = true AND lc.profile_id IS NOT NULL
        UNION ALL
        SELECT 'exercise_submitted:' || s.id, 'exercise_submitted', s.created_at, t.course_id, t.title, gm.profile_id,
          e.id::text, e.title
        FROM ${schema.submission} s
        JOIN taught t ON t.course_id = s.course_id
        JOIN ${schema.exercise} e ON e.id = s.exercise_id
        JOIN ${schema.groupmember} gm ON gm.id = s.submitted_by AND gm.role_id = ${ROLE.STUDENT}
        WHERE gm.profile_id IS NOT NULL AND s.created_at IS NOT NULL
      )
      SELECT events.id, events.kind, events.occurred_at, events.course_id, events.course_title, events.profile_id,
        p.fullname, p.username, p.avatar_url, events.subject_id, events.subject_title
      FROM events
      JOIN ${schema.profile} p ON p.id = events.profile_id
      WHERE events.occurred_at IS NOT NULL ${before}
      ORDER BY date_trunc('milliseconds', events.occurred_at) DESC, events.id DESC
      LIMIT ${options.limit}
    `);

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      occurredAt: new Date(row.occurred_at).toISOString(),
      courseId: row.course_id,
      courseTitle: row.course_title,
      learner: { id: row.profile_id, fullname: row.fullname, username: row.username, avatarUrl: row.avatar_url },
      subjectId: row.subject_id,
      subjectTitle: row.subject_title
    }));
  } catch (error) {
    console.error('listLearnerActivity error:', error);
    throw new Error('Failed to list learner activity');
  }
}

/** Number of student events in the given courses since `since`. */
export async function countLearnerActivitySince(courseIds: string[], since: Date): Promise<number> {
  if (courseIds.length === 0) return 0;

  try {
    const ids = idList(courseIds);
    const sinceIso = since.toISOString();
    const [row] = await db.execute<{ total: number }>(sql`
      WITH taught AS (
        SELECT c.id AS course_id, c.group_id FROM ${schema.course} c WHERE c.id IN (${ids})
      )
      SELECT (
        (SELECT count(*) FROM ${schema.groupmember} gm JOIN taught t ON t.group_id = gm.group_id
          WHERE gm.role_id = ${ROLE.STUDENT} AND gm.created_at >= ${sinceIso}::timestamptz)
        + (SELECT count(*) FROM ${schema.groupmember} gm JOIN taught t ON t.group_id = gm.group_id
          WHERE gm.role_id = ${ROLE.STUDENT} AND gm.completed_at >= ${sinceIso}::timestamptz)
        + (SELECT count(*) FROM ${schema.lessonCompletion} lc
          JOIN ${schema.lesson} l ON l.id = lc.lesson_id
          JOIN taught t ON t.course_id = l.course_id
          WHERE lc.is_complete = true AND COALESCE(lc.updated_at, lc.created_at) >= ${sinceIso}::timestamptz)
        + (SELECT count(*) FROM ${schema.submission} s JOIN taught t ON t.course_id = s.course_id
          WHERE s.created_at >= ${sinceIso}::timestamptz)
      )::int AS total
    `);

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countLearnerActivitySince error:', error);
    throw new Error('Failed to count learner activity');
  }
}
