import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import { submissionMeetsCompletionPolicySql } from './progression';

/**
 * CTEs that compute one learner's progress in every course of a preceding
 * `tracked_courses (course_id)` CTE, read live from `lesson_completion` and
 * `submission`. Shared by the enrolled feed and the path journey so My
 * Learning and the path hub can never disagree about a course.
 *
 * Ends with `course_progress (course_id, lessons_total, lessons_completed,
 * exercises_total, exercises_completed, last_progress_at)`. Exercises belong to
 * their course through `exercise.course_id`. Activity is the latest lesson
 * completion change (either direction, so a teacher's change surfaces) or the
 * latest submission's `created_at` (so grading never reorders anything).
 *
 * Embed after `tracked_courses`, followed by a comma:
 * sql`WITH tracked_courses AS (...), ${learnerCourseProgressCtes(profileId)}, next AS (...)`
 */
export function learnerCourseProgressCtes(profileId: string): SQL {
  return sql`
    lesson_progress AS (
      -- A lesson toggled either way counts as activity, so a teacher's change surfaces too.
      SELECT l.course_id,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE lc.is_complete) AS completed,
        MAX(COALESCE(lc.updated_at, lc.created_at)) AS last_at
      FROM tracked_courses tc
      JOIN ${schema.lesson} l ON l.course_id = tc.course_id
      LEFT JOIN ${schema.lessonCompletion} lc ON lc.lesson_id = l.id AND lc.profile_id = ${profileId}
      GROUP BY l.course_id
    ),
    course_members AS (
      SELECT tc.course_id, gm.id AS groupmember_id
      FROM tracked_courses tc
      JOIN ${schema.course} c ON c.id = tc.course_id
      JOIN ${schema.groupmember} gm ON gm.group_id = c.group_id AND gm.profile_id = ${profileId}
    ),
    exercise_attempts AS (
      -- Every submission the learner made in a tracked course. Submissions only
      -- exist under the course's own groupmember, so this matches
      -- isExerciseCompletedSql while staying on the (submitted_by, exercise_id) index.
      SELECT ex.course_id, ex.id AS exercise_id, cs.created_at,
        ${submissionMeetsCompletionPolicySql('ex', 'cs')} AS meets_policy
      FROM course_members cm
      JOIN ${schema.exercise} ex ON ex.course_id = cm.course_id
      JOIN ${schema.submission} cs ON cs.submitted_by = cm.groupmember_id AND cs.exercise_id = ex.id
    ),
    exercise_progress AS (
      SELECT ex.course_id,
        COUNT(*) AS total,
        COUNT(done.exercise_id) AS completed
      FROM tracked_courses tc
      JOIN ${schema.exercise} ex ON ex.course_id = tc.course_id
      LEFT JOIN (SELECT DISTINCT exercise_id FROM exercise_attempts WHERE meets_policy) done
        ON done.exercise_id = ex.id
      GROUP BY ex.course_id
    ),
    submission_activity AS (
      -- created_at is set once when the learner submits, so grading never reorders the feed.
      SELECT course_id, MAX(created_at) AS last_at
      FROM exercise_attempts
      GROUP BY course_id
    ),
    course_progress AS (
      SELECT tc.course_id,
        COALESCE(lp.total, 0) AS lessons_total,
        COALESCE(lp.completed, 0) AS lessons_completed,
        COALESCE(xp.total, 0) AS exercises_total,
        COALESCE(xp.completed, 0) AS exercises_completed,
        GREATEST(lp.last_at, sa.last_at) AS last_progress_at
      FROM tracked_courses tc
      LEFT JOIN lesson_progress lp ON lp.course_id = tc.course_id
      LEFT JOIN exercise_progress xp ON xp.course_id = tc.course_id
      LEFT JOIN submission_activity sa ON sa.course_id = tc.course_id
    )
  `;
}
