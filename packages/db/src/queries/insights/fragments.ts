import { sql, type SQL } from 'drizzle-orm';

import { QUESTION_TYPE_IDS } from '@cio/question-types';
import { ROLE } from '@cio/utils/constants';
import { INSIGHTS_THRESHOLDS } from '@cio/utils/constants/insights';

import { submissionMeetsCompletionPolicySql } from '../course/progression';
import { inactiveOrgMemberFilter, uuidList } from './scope';
import type { InsightsCompileContext } from './types';

const GROWTH_WEEKS_ALL_TIME = 6;
const DAILY_GROWTH_MAX_DAYS = 31;

function daysAgoStart(days: number): SQL {
  return sql`(CURRENT_DATE - ${days - 1}::int)::timestamptz`;
}

/**
 * Start of the selected range: today and the days before it. Null under All time.
 */
function windowStartSql(context: InsightsCompileContext): SQL | null {
  return context.rangeDays === null ? null : daysAgoStart(context.rangeDays);
}

/**
 * Start of the period KPI changes compare against: the selected range, or the last 7 days under All time.
 */
function periodStartSql(context: InsightsCompileContext): SQL {
  return daysAgoStart(context.periodDays);
}

function inWindowSql(column: SQL, context: InsightsCompileContext): SQL {
  const windowStart = windowStartSql(context);

  return windowStart ? sql`${column} >= ${windowStart}` : sql`TRUE`;
}

function growthBucketsSql(context: InsightsCompileContext): { series: SQL; step: SQL } {
  const days = context.rangeDays;
  if (days !== null && days <= DAILY_GROWTH_MAX_DAYS) {
    const step = sql`interval '1 day'`;

    return { series: sql`generate_series(CURRENT_DATE - ${days - 1}::int, CURRENT_DATE, ${step})`, step };
  }

  const weeks = days === null ? GROWTH_WEEKS_ALL_TIME : Math.ceil(days / 7);
  const step = sql`interval '1 week'`;
  const series = sql`generate_series(date_trunc('week', now()) - ${weeks - 1}::int * ${step}, date_trunc('week', now()), ${step})`;

  return { series, step };
}

function exerciseCtes(context: InsightsCompileContext): SQL {
  const meetsCompletionPolicy = submissionMeetsCompletionPolicySql('exercise', 'submission');
  const submissionInWindow = inWindowSql(sql`submission.created_at`, context);
  const firstAttemptInWindow = inWindowSql(sql`me.first_attempt_at`, context);

  return sql`
    scope_exercise AS (
      SELECT
        exercise.id AS exercise_id,
        sc.course_id,
        exercise.title AS exercise_title,
        exercise.section_id,
        exercise.completion_policy = 'passed' AS is_pass_required,
        CASE WHEN exercise.completion_policy = 'passed' THEN COALESCE(exercise.pass_threshold, 100) END AS pass_mark,
        COALESCE(exercise.is_unlocked, true) AS is_unlocked,
        exercise.due_by,
        COALESCE((SELECT SUM(question.points) FROM question WHERE question.exercise_id = exercise.id), 0)::numeric AS max_points
      FROM exercise
      LEFT JOIN course_section cs ON cs.id = exercise.section_id
      JOIN scope_course sc ON sc.course_id = COALESCE(exercise.course_id, cs.course_id)
    ),
    member_exercise AS (
      SELECT
        sm.group_member_id,
        sm.profile_id,
        sm.course_id,
        sm.course_title,
        sx.exercise_id,
        sx.exercise_title,
        sx.section_id,
        sx.is_pass_required,
        sx.pass_mark,
        sx.max_points,
        sx.is_unlocked,
        sx.due_by,
        attempt.attempts,
        attempt.graded_attempts,
        attempt.best_points,
        attempt.first_grading_state,
        attempt.first_total,
        attempt.first_attempt_at,
        attempt.completed_at,
        COALESCE(attempt.is_complete, false) AS is_complete
      FROM scope_member sm
      JOIN scope_exercise sx ON sx.course_id = sm.course_id
      JOIN exercise ON exercise.id = sx.exercise_id
      CROSS JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE ${submissionInWindow})::int AS attempts,
          COUNT(*) FILTER (WHERE submission.grading_state = 'completed' AND ${submissionInWindow})::int AS graded_attempts,
          (MAX(submission.total) FILTER (WHERE submission.grading_state = 'completed' AND ${submissionInWindow}))::numeric
            AS best_points,
          (array_agg(submission.grading_state ORDER BY submission.created_at, submission.id))[1] AS first_grading_state,
          ((array_agg(submission.total ORDER BY submission.created_at, submission.id))[1])::numeric AS first_total,
          MIN(submission.created_at) AS first_attempt_at,
          MIN(COALESCE(submission.updated_at, submission.created_at)) FILTER (WHERE ${meetsCompletionPolicy}) AS completed_at,
          bool_or(${meetsCompletionPolicy}) AS is_complete
        FROM submission
        WHERE submission.exercise_id = sx.exercise_id AND submission.submitted_by = sm.group_member_id
      ) attempt
    ),
    member_exercise_result AS (
      SELECT
        me.*,
        CASE WHEN me.max_points > 0 AND me.best_points IS NOT NULL
          THEN ROUND(me.best_points * 100.0 / me.max_points) END AS best_score_pct,
        CASE WHEN me.attempts = 0 THEN 'not_taken'
             WHEN me.graded_attempts = 0 THEN 'awaiting_grade'
             ELSE 'graded' END AS state,
        CASE WHEN me.is_pass_required THEN me.is_complete END AS passed,
        CASE WHEN me.is_pass_required AND me.first_grading_state = 'completed' AND me.max_points > 0
          AND ${firstAttemptInWindow}
          THEN ROUND(COALESCE(me.first_total, 0) * 100.0 / me.max_points) >= me.pass_mark END AS passed_first_try,
        CASE WHEN me.is_pass_required AND me.graded_attempts > 0 THEN NOT me.is_complete END AS still_to_pass
      FROM member_exercise me
    )`;
}

function lessonCtes(): SQL {
  return sql`
    scoped_lesson AS (
      SELECT
        lesson.id AS lesson_id,
        lesson.course_id,
        lesson.title AS lesson_title,
        lesson.section_id,
        (
          lesson.completion_policy = 'video_watch'
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(lesson.videos, '[]'::jsonb)) AS video
            WHERE video ->> 'type' = 'upload' AND COALESCE(video ->> 'assetId', '') <> ''
          )
        ) AS is_video_tracked
      FROM lesson
      JOIN scope_course sc ON sc.course_id = lesson.course_id
    ),
    member_lesson AS (
      SELECT
        sm.group_member_id,
        sm.profile_id,
        sm.course_id,
        lsn.lesson_id,
        lsn.lesson_title,
        lsn.section_id,
        lsn.is_video_tracked,
        COALESCE(lesson_completion.is_complete, false) AS is_complete,
        CASE WHEN lesson_completion.is_complete
          THEN COALESCE(lesson_completion.updated_at, lesson_completion.created_at) END AS completed_at
      FROM scope_member sm
      JOIN scoped_lesson lsn ON lsn.course_id = sm.course_id
      LEFT JOIN lesson_completion
        ON lesson_completion.lesson_id = lsn.lesson_id AND lesson_completion.profile_id = sm.profile_id
    ),
    attendance_taken AS (
      SELECT DISTINCT group_attendance.course_id, group_attendance.lesson_id
      FROM group_attendance
      JOIN scoped_lesson lsn ON lsn.lesson_id = group_attendance.lesson_id AND lsn.course_id = group_attendance.course_id
    ),
    member_attendance AS (
      SELECT
        sm.group_member_id,
        sm.course_id,
        taken.lesson_id,
        lsn.section_id,
        COALESCE(bool_or(group_attendance.is_present), false) AS is_present
      FROM scope_member sm
      JOIN attendance_taken taken ON taken.course_id = sm.course_id
      JOIN scoped_lesson lsn ON lsn.lesson_id = taken.lesson_id
      LEFT JOIN group_attendance
        ON group_attendance.course_id = taken.course_id
        AND group_attendance.lesson_id = taken.lesson_id
        AND group_attendance.student_id = sm.group_member_id
      GROUP BY sm.group_member_id, sm.course_id, taken.lesson_id, lsn.section_id
    )`;
}

function overdueCte(context: InsightsCompileContext): SQL {
  return sql`
    overdue_item AS (
      SELECT
        'goal'::text AS kind,
        cga.id AS item_id,
        cm.profile_id,
        goal.cohort_id,
        goal.title AS item_title,
        cga.due_date AS due_at,
        goal_courses.course_ids,
        cga.id AS assignment_id
      FROM cohort_goal_assignment cga
      JOIN cohort_goal goal ON goal.id = cga.goal_id AND goal.status = 'active'
      JOIN cohort ON cohort.id = goal.cohort_id AND cohort.organization_id = ${context.scope.orgId}
      JOIN cohort_member cm ON cm.id = cga.cohort_member_id AND cm.role_id = ${ROLE.STUDENT}
      JOIN scope_student sl ON sl.profile_id = cm.profile_id AND (sl.cohort_id IS NULL OR sl.cohort_id = goal.cohort_id)
      CROSS JOIN LATERAL (
        SELECT COALESCE(array_agg(cc.course_id), '{}'::uuid[]) AS course_ids
        FROM cohort_course cc
        JOIN scope_course sc ON sc.course_id = cc.course_id
        WHERE cc.cohort_id = goal.cohort_id
          AND (jsonb_array_length(goal.course_ids) = 0 OR goal.course_ids ? cc.course_id::text)
      ) goal_courses
      WHERE cga.due_date < now()
        AND cga.status NOT IN ('completed', 'waived')
        AND cardinality(goal_courses.course_ids) > 0

      UNION ALL

      SELECT
        'compliance'::text,
        latest.id,
        latest.profile_id,
        NULL::uuid,
        sm.course_title,
        latest.due_date,
        ARRAY[latest.course_id],
        NULL::uuid
      FROM (
        SELECT DISTINCT ON (record.group_member_id) record.*
        FROM course_completion_record record
        JOIN scope_member member ON member.group_member_id = record.group_member_id
        ORDER BY record.group_member_id, record.cycle_number DESC
      ) latest
      JOIN scope_member sm ON sm.group_member_id = latest.group_member_id
      WHERE latest.due_date < now()
        AND latest.completed_at IS NULL
        AND latest.status NOT IN ('compliant', 'waived')

      UNION ALL

      SELECT
        'exercise'::text,
        mer.exercise_id,
        mer.profile_id,
        NULL::uuid,
        mer.exercise_title,
        mer.due_by AT TIME ZONE 'UTC',
        ARRAY[mer.course_id],
        NULL::uuid
      FROM member_exercise_result mer
      WHERE mer.due_by < (now() AT TIME ZONE 'UTC') AND NOT mer.is_complete
    ),
    overdue_row AS (
      SELECT
        oi.*,
        oi.kind || ':' || oi.item_id::text || ':' || oi.profile_id::text AS item_key,
        profile.fullname,
        profile.email,
        cohort.name AS cohort_name,
        GREATEST(0, CURRENT_DATE - (oi.due_at AT TIME ZONE 'UTC')::date) AS days_overdue,
        (SELECT string_agg(sc.course_title, ', ' ORDER BY sc.course_title)
         FROM scope_course sc WHERE sc.course_id = ANY (oi.course_ids)) AS course_titles
      FROM overdue_item oi
      JOIN profile ON profile.id = oi.profile_id
      LEFT JOIN cohort ON cohort.id = oi.cohort_id
    ),
    overdue_student_course AS (
      SELECT
        oi.profile_id,
        course_id,
        bool_or(oi.cohort_id IS NULL) AS all_cohorts,
        array_remove(array_agg(DISTINCT oi.cohort_id), NULL) AS cohort_ids,
        bool_or(oi.kind = 'goal') AS has_goal,
        array_remove(array_agg(DISTINCT CASE WHEN oi.kind = 'goal' THEN oi.cohort_id END), NULL) AS goal_cohort_ids
      FROM overdue_item oi
      CROSS JOIN LATERAL unnest(oi.course_ids) AS course_id
      GROUP BY oi.profile_id, course_id
    ),
    overdue_student AS (
      SELECT
        oi.profile_id,
        bool_or(oi.cohort_id IS NULL) AS all_cohorts,
        array_remove(array_agg(DISTINCT oi.cohort_id), NULL) AS cohort_ids,
        bool_or(oi.kind = 'goal') AS has_goal
      FROM overdue_item oi
      GROUP BY oi.profile_id
    )`;
}

function courseCtes(context: InsightsCompileContext): SQL {
  const periodStart = periodStartSql(context);
  const completedInWindow = inWindowSql(sql`completion.completed_at`, context);
  const nowAt = context.orderedItems.length
    ? sql`
      LEFT JOIN LATERAL (
        SELECT ci.item_id, COALESCE(course_section.title, ml.lesson_title, mer.exercise_title) AS title
        FROM course_item ci
        LEFT JOIN course_section ON course_section.id = ci.section_id
        LEFT JOIN member_lesson ml
          ON ci.item_type = 'LESSON' AND ml.group_member_id = sm.group_member_id AND ml.lesson_id = ci.item_id
        LEFT JOIN member_exercise_result mer
          ON ci.item_type = 'EXERCISE' AND mer.group_member_id = sm.group_member_id AND mer.exercise_id = ci.item_id
        WHERE ci.course_id = sm.course_id AND NOT COALESCE(ml.is_complete, mer.is_complete, false)
        ORDER BY ci.item_rank
        LIMIT 1
      ) now_at ON true`
    : sql`LEFT JOIN LATERAL (SELECT NULL::uuid AS item_id, NULL::text AS title) now_at ON true`;

  return sql`
    course_totals AS (
      SELECT
        sc.course_id,
        COALESCE(lsn.lessons_total, 0)::int AS lessons_total,
        COALESCE(sx.exercises_total, 0)::int AS exercises_total
      FROM scope_course sc
      LEFT JOIN (
        SELECT lsn.course_id, COUNT(*)::int AS lessons_total
        FROM scoped_lesson lsn
        GROUP BY lsn.course_id
      ) lsn ON lsn.course_id = sc.course_id
      LEFT JOIN (
        SELECT sx.course_id, COUNT(*)::int AS exercises_total
        FROM scope_exercise sx
        GROUP BY sx.course_id
      ) sx ON sx.course_id = sc.course_id
    ),
    member_lesson_totals AS (
      SELECT
        group_member_id,
        COUNT(*) FILTER (WHERE is_complete)::int AS lessons_completed,
        COUNT(*) FILTER (WHERE is_complete AND completed_at < ${periodStart})::int AS lessons_completed_at_period_start,
        MAX(completed_at) AS last_lesson_completed_at,
        COUNT(*) FILTER (WHERE is_video_tracked)::int AS video_lessons,
        COUNT(*) FILTER (WHERE is_video_tracked AND is_complete)::int AS video_watched
      FROM member_lesson
      GROUP BY group_member_id
    ),
    member_exercise_totals AS (
      SELECT
        group_member_id,
        COUNT(*) FILTER (WHERE is_complete)::int AS exercises_completed,
        COUNT(*) FILTER (WHERE is_complete AND completed_at < ${periodStart})::int AS exercises_completed_at_period_start,
        MAX(completed_at) FILTER (WHERE is_complete) AS last_exercise_completed_at,
        SUM(best_points) FILTER (WHERE state = 'graded' AND max_points > 0) AS graded_points,
        SUM(max_points) FILTER (WHERE state = 'graded' AND max_points > 0) AS graded_max_points,
        COUNT(*) FILTER (WHERE is_pass_required)::int AS pass_mark_exercises,
        COUNT(*) FILTER (WHERE is_pass_required AND passed)::int AS pass_mark_passed,
        COUNT(*) FILTER (WHERE passed_first_try IS NOT NULL)::int AS first_try_graded,
        COUNT(*) FILTER (WHERE passed_first_try)::int AS first_try_passed,
        COUNT(*) FILTER (WHERE still_to_pass)::int AS still_to_pass
      FROM member_exercise_result
      GROUP BY group_member_id
    ),
    member_attendance_totals AS (
      SELECT
        group_member_id,
        COUNT(*)::int AS attendance_lessons,
        COUNT(*) FILTER (WHERE is_present)::int AS attendance_present
      FROM member_attendance
      GROUP BY group_member_id
    ),
    student_course_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        sm.group_member_id,
        sm.profile_id,
        profile.fullname,
        profile.email,
        sm.course_id,
        sm.course_title,
        sm.course_created_at,
        sm.enrolled_at,
        sm.certificate_earned_at,
        totals.items_total,
        totals.items_completed,
        totals.items_completed_at_period_start,
        CASE WHEN totals.items_total > 0
          THEN ROUND(totals.items_completed * 100.0 / totals.items_total) ELSE 0 END AS progress_pct,
        CASE WHEN totals.items_total > 0
          THEN ROUND(totals.items_completed_at_period_start * 100.0 / totals.items_total) ELSE 0 END AS progress_pct_at_period_start,
        completion.completed_at IS NOT NULL AS is_completed,
        completion.completed_at,
        (completion.completed_at IS NOT NULL AND ${completedInWindow}) AS completed_in_window,
        certificate.issued_at IS NOT NULL AS is_certified,
        COALESCE(certificate.issued_at >= ${periodStart}, false) AS certified_in_period,
        COALESCE(sm.enrolled_at >= ${periodStart}, false) AS enrolled_in_period,
        COALESCE(sm.enrolled_at < ${periodStart}, false) AS enrolled_at_period_start,
        COALESCE(completion.completed_at >= ${periodStart}, false) AS completed_in_period,
        COALESCE(completion.completed_at < ${periodStart}, false) AS completed_at_period_start,
        COALESCE(met.graded_points, 0) AS graded_points,
        COALESCE(met.graded_max_points, 0) AS graded_max_points,
        CASE WHEN met.graded_max_points > 0
          THEN ROUND(met.graded_points * 100.0 / met.graded_max_points) END AS avg_score_pct,
        COALESCE(met.pass_mark_exercises, 0) AS pass_mark_exercises,
        COALESCE(met.pass_mark_passed, 0) AS pass_mark_passed,
        COALESCE(met.first_try_graded, 0) AS first_try_graded,
        COALESCE(met.first_try_passed, 0) AS first_try_passed,
        COALESCE(met.still_to_pass, 0) AS still_to_pass,
        COALESCE(met.first_try_graded, 0) > 0 AS took_pass_mark,
        COALESCE(met.still_to_pass, 0) > 0 AS has_still_to_pass,
        COALESCE(mlt.video_lessons, 0) AS video_lessons,
        COALESCE(mlt.video_watched, 0) AS video_watched,
        COALESCE(mat.attendance_lessons, 0) AS attendance_lessons,
        COALESCE(mat.attendance_present, 0) AS attendance_present,
        CASE WHEN completion.completed_at IS NOT NULL AND sm.enrolled_at IS NOT NULL AND ${completedInWindow}
          THEN GREATEST(0, EXTRACT(EPOCH FROM completion.completed_at - sm.enrolled_at) / 86400) END AS days_to_finish,
        (
          olc.profile_id IS NOT NULL
          AND (olc.all_cohorts OR se.cohort_id IS NULL OR se.cohort_id = ANY (olc.cohort_ids))
        ) AS is_overdue,
        (
          olc.profile_id IS NOT NULL
          AND olc.has_goal
          AND (se.cohort_id IS NULL OR se.cohort_id = ANY (olc.goal_cohort_ids))
        ) AS has_overdue_goal,
        now_at.item_id AS now_at_item_id,
        now_at.title AS now_at_title
      FROM scope_enrollment se
      JOIN scope_member sm ON sm.group_member_id = se.group_member_id
      JOIN profile ON profile.id = sm.profile_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      JOIN course_totals ct ON ct.course_id = sm.course_id
      LEFT JOIN member_lesson_totals mlt ON mlt.group_member_id = sm.group_member_id
      LEFT JOIN member_exercise_totals met ON met.group_member_id = sm.group_member_id
      LEFT JOIN member_attendance_totals mat ON mat.group_member_id = sm.group_member_id
      LEFT JOIN overdue_student_course olc
        ON olc.profile_id = sm.profile_id AND olc.course_id = sm.course_id
      CROSS JOIN LATERAL (
        SELECT COALESCE(sm.certificate_earned_at, MIN(issue.issued_at)) AS issued_at
        FROM course_certificate_issue issue
        WHERE issue.course_id = sm.course_id AND issue.profile_id = sm.profile_id AND issue.status = 'valid'
      ) certificate
      CROSS JOIN LATERAL (
        SELECT
          ct.lessons_total + ct.exercises_total AS items_total,
          COALESCE(mlt.lessons_completed, 0) + COALESCE(met.exercises_completed, 0) AS items_completed,
          COALESCE(mlt.lessons_completed_at_period_start, 0) + COALESCE(met.exercises_completed_at_period_start, 0) AS items_completed_at_period_start
      ) totals
      CROSS JOIN LATERAL (
        SELECT COALESCE(
          sm.completed_at,
          sm.certificate_earned_at,
          CASE
            WHEN totals.items_total > 0 AND totals.items_completed >= totals.items_total
              THEN GREATEST(mlt.last_lesson_completed_at, met.last_exercise_completed_at)
          END
        ) AS completed_at
      ) completion
      ${nowAt}
    )`;
}

function studentCtes(context: InsightsCompileContext): SQL {
  const { inactiveDays, lowScorePct, laggingScorePct, lowVideoPct } = INSIGHTS_THRESHOLDS;
  const periodStart = periodStartSql(context);
  const perCohort = context.byCohort;
  const overdueJoin = perCohort ? sql`` : sql`LEFT JOIN overdue_student ola ON ola.profile_id = core.profile_id`;
  const isOverdue = perCohort
    ? sql`core.is_overdue_cohort`
    : sql`(ola.profile_id IS NOT NULL AND (ola.all_cohorts OR core.cohort_id IS NULL OR core.cohort_id = ANY (ola.cohort_ids)))`;
  const hasOverdueGoal = perCohort ? sql`core.has_overdue_goal_cohort` : sql`COALESCE(ola.has_goal, false)`;
  const cohortOverdueColumns = perCohort
    ? sql`COALESCE(bool_or(lcr.is_overdue), false) AS is_overdue_cohort,
        COALESCE(bool_or(lcr.has_overdue_goal), false) AS has_overdue_goal_cohort,`
    : sql``;

  return sql`
    student_core AS (
      SELECT
        sl.profile_id,
        sl.cohort_id,
        COUNT(lcr.course_id)::int AS courses_total,
        COUNT(lcr.course_id) FILTER (WHERE lcr.is_completed)::int AS courses_completed,
        COUNT(lcr.course_id) FILTER (WHERE lcr.is_certified)::int AS certificates,
        COALESCE(SUM(lcr.items_total), 0) AS items_total,
        COALESCE(SUM(lcr.items_completed), 0) AS items_completed,
        COALESCE(SUM(lcr.items_completed_at_period_start), 0) AS items_completed_at_period_start,
        MIN(lcr.enrolled_at) AS first_enrolled_at,
        CASE WHEN COUNT(lcr.course_id) > 0 AND bool_and(lcr.is_completed) THEN MAX(lcr.completed_at) END AS completed_all_at,
        COALESCE(SUM(lcr.graded_points), 0) AS graded_points,
        COALESCE(SUM(lcr.graded_max_points), 0) AS graded_max_points,
        COALESCE(SUM(lcr.video_lessons), 0) AS video_lessons,
        COALESCE(SUM(lcr.video_watched), 0) AS video_watched,
        COALESCE(SUM(lcr.attendance_lessons), 0) AS attendance_lessons,
        COALESCE(SUM(lcr.attendance_present), 0) AS attendance_present,
        ${cohortOverdueColumns}
        CASE WHEN COUNT(lcr.course_id) = 1 THEN MIN(lcr.now_at_title) END AS now_at_title
      FROM scope_student sl
      LEFT JOIN student_course_row lcr
        ON lcr.profile_id = sl.profile_id AND lcr.cohort_id IS NOT DISTINCT FROM sl.cohort_id
      GROUP BY sl.profile_id, sl.cohort_id
    ),
    student_activity AS (
      SELECT
        core.*,
        profile.fullname,
        profile.email,
        profile.avatar_url,
        cohort.name AS cohort_name,
        CASE WHEN core.items_total > 0
          THEN ROUND(core.items_completed * 100.0 / core.items_total) ELSE 0 END AS overall_progress_pct,
        CASE WHEN core.items_total > 0 AND core.first_enrolled_at < ${periodStart}
          THEN ROUND(core.items_completed * 100.0 / core.items_total) END AS overall_progress_pct_existing,
        CASE WHEN core.items_total > 0 AND core.first_enrolled_at < ${periodStart}
          THEN ROUND(core.items_completed_at_period_start * 100.0 / core.items_total) END AS overall_progress_pct_at_period_start,
        CASE WHEN core.graded_max_points > 0
          THEN ROUND(core.graded_points * 100.0 / core.graded_max_points) END AS avg_score_pct,
        CASE WHEN core.video_lessons > 0
          THEN ROUND(core.video_watched * 100.0 / core.video_lessons) END AS video_pct,
        CASE WHEN core.attendance_lessons > 0
          THEN ROUND(core.attendance_present * 100.0 / core.attendance_lessons) END AS attendance_pct,
        (core.courses_total > 0 AND core.courses_completed = core.courses_total) AS is_completed_all,
        COALESCE(core.completed_all_at >= ${periodStart}, false) AS completed_all_in_period,
        core.certificates > 0 AS has_certificate,
        login.last_login_at,
        CURRENT_DATE - login.last_login_date AS days_since_login,
        COALESCE(login.last_login_date = CURRENT_DATE, false) AS logged_in_today,
        COALESCE(login.last_login_at >= ${periodStart}, false) AS logged_in_period,
        ${isOverdue} AS is_overdue,
        ${hasOverdueGoal} AS has_overdue_goal
      FROM student_core core
      JOIN profile ON profile.id = core.profile_id
      LEFT JOIN cohort ON cohort.id = core.cohort_id
      ${overdueJoin}
      LEFT JOIN LATERAL (
        SELECT MAX(le.logged_in_at) AS last_login_at, MAX(le.logged_in_date) AS last_login_date
        FROM analytics_login_events le
        WHERE le.user_id = core.profile_id
      ) login ON true
    ),
    student_flagged AS (
      SELECT
        la.*,
        (la.days_since_login IS NULL OR la.days_since_login >= ${inactiveDays}) AS is_inactive,
        COALESCE(la.avg_score_pct < ${lowScorePct}, false) AS is_low_score,
        COALESCE(la.avg_score_pct < ${laggingScorePct}, false) AS is_below_lagging,
        COALESCE(la.video_pct < ${lowVideoPct}, false) AS is_low_video
      FROM student_activity la
    ),
    student_status AS (
      SELECT
        lf.*,
        CASE WHEN lf.is_completed_all THEN 'completed'
             WHEN lf.is_inactive OR lf.is_low_score OR lf.is_overdue THEN 'at_risk'
             WHEN lf.is_below_lagging OR lf.is_low_video THEN 'lagging'
             ELSE 'on_track' END AS status
      FROM student_flagged lf
    ),
    student_row AS (
      SELECT
        ls.*,
        CASE ls.status WHEN 'at_risk' THEN 0 WHEN 'lagging' THEN 1 WHEN 'on_track' THEN 2 ELSE 3 END AS status_rank,
        ls.status = 'at_risk' AS is_at_risk
      FROM student_status ls
    )`;
}

function overdueStudentCte(): SQL {
  return sql`
    overdue_student_row AS (
      SELECT
        overdue.profile_id,
        student.fullname,
        student.email,
        student.last_login_at,
        overdue.course_titles,
        overdue.item_titles,
        overdue.days_overdue,
        overdue.has_goal,
        progress.course_progress_pct
      FROM (
        SELECT
          oi.profile_id,
          array_agg(DISTINCT overdue_course_id) AS course_ids,
          string_agg(DISTINCT sc.course_title, ', ' ORDER BY sc.course_title) AS course_titles,
          string_agg(DISTINCT oi.item_title, ', ' ORDER BY oi.item_title) AS item_titles,
          MAX(GREATEST(0, CURRENT_DATE - (oi.due_at AT TIME ZONE 'UTC')::date))::int AS days_overdue,
          bool_or(oi.kind = 'goal') AS has_goal
        FROM overdue_item oi
        CROSS JOIN LATERAL unnest(oi.course_ids) AS overdue_course_id
        JOIN scope_course sc ON sc.course_id = overdue_course_id
        GROUP BY oi.profile_id
      ) overdue
      JOIN LATERAL (
        SELECT lr.fullname, lr.email, lr.last_login_at
        FROM student_row lr
        WHERE lr.profile_id = overdue.profile_id
        LIMIT 1
      ) student ON true
      CROSS JOIN LATERAL (
        SELECT CASE WHEN SUM(lcr.items_total) > 0
          THEN ROUND(SUM(lcr.items_completed) * 100.0 / SUM(lcr.items_total)) END AS course_progress_pct
        FROM student_course_row lcr
        WHERE lcr.profile_id = overdue.profile_id AND lcr.course_id = ANY (overdue.course_ids)
      ) progress
    )`;
}

function cohortSummaryCte(context: InsightsCompileContext): SQL {
  const { scope, pushdown } = context;
  const courseScopeFilter =
    scope.type === 'course'
      ? sql`AND EXISTS (
          SELECT 1 FROM cohort_course cc JOIN scope_course sc ON sc.course_id = cc.course_id
          WHERE cc.cohort_id = cohort.id
        )`
      : sql``;
  const courseFilter = pushdown.courseIds?.length
    ? sql`AND EXISTS (
        SELECT 1 FROM cohort_course cc JOIN scope_course sc ON sc.course_id = cc.course_id
        WHERE cc.cohort_id = cohort.id AND cc.course_id IN (${uuidList(pushdown.courseIds)})
      )`
    : sql``;
  const cohortFilter = pushdown.cohortIds?.length ? sql`AND cohort.id IN (${uuidList(pushdown.cohortIds)})` : sql``;
  const studentCount = scope.type === 'org' ? sql`COALESCE(members.students, 0)` : sql`COALESCE(stats.students, 0)`;

  return sql`
    cohort_member_count AS (
      SELECT
        cm.cohort_id,
        COUNT(*) FILTER (
          WHERE cm.profile_id IS NOT NULL AND ${inactiveOrgMemberFilter(sql`cm.profile_id`, scope.orgId)}
        )::int AS students,
        COUNT(*) FILTER (WHERE cm.profile_id IS NULL)::int AS pending_invites
      FROM cohort_member cm
      JOIN cohort ON cohort.id = cm.cohort_id AND cohort.organization_id = ${scope.orgId}
      WHERE cm.role_id = ${ROLE.STUDENT}
      GROUP BY cm.cohort_id
    ),
    cohort_student_stats AS (
      SELECT
        cohort_id,
        COUNT(*)::int AS students,
        ROUND(AVG(overall_progress_pct), 1) AS avg_progress_pct,
        ROUND(AVG(avg_score_pct), 1) AS avg_score_pct,
        COUNT(*) FILTER (WHERE is_overdue)::int AS overdue_students,
        COUNT(*) FILTER (WHERE is_at_risk)::int AS at_risk_students,
        COUNT(*) FILTER (WHERE is_completed_all)::int AS completed_students
      FROM student_row
      WHERE cohort_id IS NOT NULL
      GROUP BY cohort_id
    ),
    cohort_attempt_stats AS (
      SELECT
        cohort_id,
        SUM(first_try_passed)::int AS first_try_passed,
        SUM(first_try_graded)::int AS first_try_graded
      FROM student_course_row
      WHERE cohort_id IS NOT NULL
      GROUP BY cohort_id
    ),
    cohort_summary_row AS (
      SELECT
        cohort.id AS cohort_id,
        cohort.name AS cohort_name,
        cohort.created_at AS cohort_created_at,
        ${studentCount} AS students,
        COALESCE(members.pending_invites, 0) AS pending_invites,
        stats.avg_progress_pct,
        stats.avg_score_pct,
        COALESCE(stats.overdue_students, 0) AS overdue_students,
        COALESCE(stats.at_risk_students, 0) AS at_risk_students,
        COALESCE(stats.completed_students, 0) AS completed_students,
        COALESCE(attempts.first_try_passed, 0) AS first_try_passed,
        COALESCE(attempts.first_try_graded, 0) AS first_try_graded
      FROM cohort
      LEFT JOIN cohort_member_count members ON members.cohort_id = cohort.id
      LEFT JOIN cohort_student_stats stats ON stats.cohort_id = cohort.id
      LEFT JOIN cohort_attempt_stats attempts ON attempts.cohort_id = cohort.id
      WHERE cohort.organization_id = ${scope.orgId}
        AND cohort.status <> 'ARCHIVED'
        ${courseScopeFilter}
        ${courseFilter}
        ${cohortFilter}
    )`;
}

function sectionCtes(): SQL {
  return sql`
    section_exercise AS (
      SELECT
        group_member_id,
        course_id,
        section_id,
        COUNT(*)::int AS exercises_total,
        COUNT(*) FILTER (WHERE state = 'graded')::int AS exercises_graded,
        ROUND(AVG(best_score_pct) FILTER (WHERE state = 'graded')) AS section_score_pct,
        COUNT(*) FILTER (WHERE is_pass_required)::int AS pass_mark_exercises,
        COUNT(*) FILTER (WHERE passed_first_try IS NOT NULL)::int AS first_try_graded,
        COUNT(*) FILTER (WHERE passed_first_try)::int AS first_try_passed
      FROM member_exercise_result
      GROUP BY group_member_id, course_id, section_id
    ),
    section_lesson AS (
      SELECT
        group_member_id,
        course_id,
        section_id,
        COUNT(*) FILTER (WHERE is_video_tracked)::int AS video_lessons,
        COUNT(*) FILTER (WHERE is_video_tracked AND is_complete)::int AS video_watched
      FROM member_lesson
      GROUP BY group_member_id, course_id, section_id
    ),
    section_attendance AS (
      SELECT
        group_member_id,
        course_id,
        section_id,
        COUNT(*)::int AS attendance_lessons,
        COUNT(*) FILTER (WHERE is_present)::int AS attendance_present
      FROM member_attendance
      GROUP BY group_member_id, course_id, section_id
    ),
    section_key AS (
      SELECT group_member_id, course_id, section_id FROM section_exercise
      UNION
      SELECT group_member_id, course_id, section_id FROM section_lesson
      UNION
      SELECT group_member_id, course_id, section_id FROM section_attendance
    ),
    section_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        sm.profile_id,
        sm.course_id,
        sm.course_title,
        k.section_id,
        course_section.title AS section_title,
        (SELECT MIN(ci.section_rank) FROM course_item ci
         WHERE ci.course_id = k.course_id AND ci.section_id = k.section_id) AS section_rank,
        COALESCE(sx.exercises_total, 0) AS exercises_total,
        (COALESCE(sx.exercises_total, 0) > 0 AND sx.exercises_graded = sx.exercises_total) AS took_all,
        sx.section_score_pct,
        CASE WHEN COALESCE(sx.pass_mark_exercises, 0) = 0 OR sx.first_try_graded < sx.pass_mark_exercises THEN NULL
             ELSE sx.first_try_passed = sx.pass_mark_exercises END AS passed_first_try,
        CASE WHEN slx.video_lessons > 0
          THEN ROUND(slx.video_watched * 100.0 / slx.video_lessons) END AS video_pct,
        COALESCE(sa.attendance_lessons, 0) AS attendance_lessons,
        COALESCE(sa.attendance_present, 0) AS attendance_present
      FROM section_key k
      JOIN scope_member sm ON sm.group_member_id = k.group_member_id
      JOIN scope_enrollment se ON se.group_member_id = k.group_member_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_section ON course_section.id = k.section_id
      LEFT JOIN section_exercise sx
        ON sx.group_member_id = k.group_member_id AND sx.section_id IS NOT DISTINCT FROM k.section_id
      LEFT JOIN section_lesson slx
        ON slx.group_member_id = k.group_member_id AND slx.section_id IS NOT DISTINCT FROM k.section_id
      LEFT JOIN section_attendance sa
        ON sa.group_member_id = k.group_member_id AND sa.section_id IS NOT DISTINCT FROM k.section_id
    )`;
}

function wrongAnswerSql(): SQL {
  return sql`CASE question.question_type_id
    WHEN ${QUESTION_TYPE_IDS.RADIO} THEN (
      SELECT o.label FROM "option" o WHERE o.id = (qa.answer_data ->> 'optionId')::bigint
    )
    WHEN ${QUESTION_TYPE_IDS.TRUE_FALSE} THEN qa.answer_data ->> 'value'
    WHEN ${QUESTION_TYPE_IDS.CHECKBOX} THEN (
      SELECT string_agg(o.label, ', ' ORDER BY o.label)
      FROM "option" o
      WHERE o.id IN (SELECT jsonb_array_elements_text(qa.answer_data -> 'optionIds')::bigint)
    )
  END`;
}

function assessmentCtes(context: InsightsCompileContext): SQL {
  const growth = growthBucketsSql(context);

  return sql`
    assessment_row AS (
      SELECT
        mer.*,
        se.cohort_id,
        cohort.name AS cohort_name,
        profile.fullname,
        ci.item_rank AS exercise_rank,
        ci.section_rank
      FROM member_exercise_result mer
      JOIN scope_enrollment se ON se.group_member_id = mer.group_member_id
      JOIN profile ON profile.id = mer.profile_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_item ci ON ci.item_id = mer.exercise_id
    ),
    best_submission AS (
      SELECT DISTINCT ON (submission.submitted_by, submission.exercise_id)
        submission.id AS submission_id,
        submission.submitted_by AS group_member_id,
        submission.exercise_id
      FROM submission
      JOIN scope_member sm ON sm.group_member_id = submission.submitted_by
      JOIN scope_exercise sx ON sx.exercise_id = submission.exercise_id AND sx.course_id = sm.course_id
      WHERE submission.grading_state = 'completed' AND ${inWindowSql(sql`submission.created_at`, context)}
      ORDER BY submission.submitted_by, submission.exercise_id, submission.total DESC NULLS LAST, submission.created_at DESC
    ),
    question_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        se.profile_id,
        se.course_id,
        se.course_title,
        bs.exercise_id,
        sx.exercise_title,
        COALESCE(question_section.title, sx.exercise_title) AS question_context,
        question.id AS question_id,
        question.title AS question_title,
        COALESCE(ci.item_rank, 0) * 10000 + COALESCE(question."order", 0) AS question_rank,
        ROUND(COALESCE(qa.point, 0) * 100.0 / question.points) AS correct_pct,
        CASE WHEN COALESCE(qa.point, 0) < question.points THEN ${wrongAnswerSql()} END AS wrong_answer
      FROM best_submission bs
      JOIN scope_enrollment se ON se.group_member_id = bs.group_member_id
      JOIN scope_exercise sx ON sx.exercise_id = bs.exercise_id AND sx.course_id = se.course_id
      LEFT JOIN course_section question_section ON question_section.id = sx.section_id
      JOIN question ON question.exercise_id = bs.exercise_id AND question.points > 0
      LEFT JOIN question_answer qa ON qa.submission_id = bs.submission_id AND qa.question_id = question.id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_item ci ON ci.item_id = bs.exercise_id
    ),
    lesson_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        ml.profile_id,
        ml.course_id,
        ml.lesson_id,
        ml.lesson_title,
        ci.item_rank AS lesson_rank,
        ml.is_complete
      FROM member_lesson ml
      JOIN scope_enrollment se ON se.group_member_id = ml.group_member_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_item ci ON ci.item_id = ml.lesson_id
    ),
    login_event_day AS (
      SELECT DISTINCT le.user_id, le.logged_in_date
      FROM analytics_login_events le
      WHERE le.logged_in_date >= CURRENT_DATE - ${context.loginWindowDays - 1}::int
    ),
    login_day_row AS (
      SELECT
        sl.profile_id,
        sl.cohort_id,
        cohort.name AS cohort_name,
        day.day::date AS day,
        led.user_id IS NOT NULL AS logged_in
      FROM scope_student sl
      LEFT JOIN cohort ON cohort.id = sl.cohort_id
      CROSS JOIN generate_series(CURRENT_DATE - ${context.loginWindowDays - 1}::int, CURRENT_DATE, interval '1 day') AS day(day)
      LEFT JOIN login_event_day led
        ON led.user_id = sl.profile_id AND led.logged_in_date = day.day::date
    ),
    org_member_row AS (
      SELECT
        bucket.bucket_start::date AS period,
        COUNT(om.id) FILTER (WHERE om.created_at >= bucket.bucket_start)::int AS members_added,
        COUNT(om.id)::int AS members_total
      FROM ${growth.series} AS bucket(bucket_start)
      LEFT JOIN organizationmember om
        ON om.organization_id = ${context.scope.orgId}
        AND om.role_id = ${ROLE.STUDENT}
        AND om.status = 'ACTIVE'
        AND om.profile_id IS NOT NULL
        AND om.created_at < bucket.bucket_start + ${growth.step}
      GROUP BY bucket.bucket_start
    )`;
}

/**
 * Every metric CTE, in dependency order. Expects the CTEs from `scopeCtes` to precede it in the same WITH clause.
 */
export function insightsMetricCtes(context: InsightsCompileContext): SQL {
  return sql.join(
    [
      exerciseCtes(context),
      lessonCtes(),
      overdueCte(context),
      courseCtes(context),
      studentCtes(context),
      overdueStudentCte(),
      cohortSummaryCte(context),
      sectionCtes(),
      assessmentCtes(context)
    ],
    sql`,`
  );
}
