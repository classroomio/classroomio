import { and, asc, count, eq, gte, inArray, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants';
import { startOfCurrentMonthUtc } from '@cio/utils/functions';

import * as schema from '../../schema';
import type { TLearningPathMemberWithProfile } from './learning-path-member';
import { submissionMeetsCompletionPolicySql } from '../course/progression';

/** Lookback window for "active learner" and "stuck" activity checks. */
export const ACTIVE_WINDOW_DAYS = 14;
/** Maximum stuck lessons/exercises returned per path. */
export const STUCK_ITEMS_LIMIT = 10;
/** Number of seconds in a day (24 * 60 * 60), used to convert epoch seconds into days. */
export const SECONDS_PER_DAY = 24 * 60 * 60;

/**
 * Summary statistics for a learning path.
 * Member counts are learners-only (student role, including pending email
 * invites), matching the People subtitle and overview — like the course
 * Students card. Staff are reported separately via tutorsCount.
 */
export interface TPathAnalyticsSummary {
  enrolled: number;
  newThisMonth: number;
  tutorsCount: number;
  activeLearners: number;
  completionRate: number;
  completedCount: number;
  avgTimeToFinishDays: number | null;
}

/**
 * Per-course funnel row with completion, in-progress, and drop-off counts.
 */
export interface TPathCourseFunnelRow {
  learningPathCourseId: string;
  courseId: string;
  title: string;
  order: number;
  completedCount: number;
  inProgressCount: number;
  droppedAfterPrevious: number;
  completionRate: number;
  certificatesAwarded?: number;
}

/**
 * A lesson or exercise where learners are stuck.
 */
export interface TStuckItem {
  itemType: 'lesson' | 'exercise';
  itemId: string;
  itemTitle: string;
  courseTitle: string;
  stuckCount: number;
}

/**
 * Returns summary statistics for a learning path.
 * Active learners = student members with lesson_completion or submission activity in the last 14 days.
 * Completion rate = completed members / enrolled * 100.
 * Avg time to finish = average days between enrolledAt and completedAt for completed members.
 */
export async function getPathAnalyticsSummary(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<TPathAnalyticsSummary> {
  try {
    const monthStart = startOfCurrentMonthUtc();
    const enrolledMember = and(
      eq(schema.learningPathMember.learningPathId, learningPathId),
      isNull(schema.learningPathMember.removedAt)
    );
    const enrolledStudent = and(enrolledMember, eq(schema.learningPathMember.roleId, ROLE.STUDENT));

    const [enrolledRows, newRows, tutorsRows, completedRows, pathCourses] = await Promise.all([
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .where(enrolledStudent),
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .where(and(enrolledStudent, gte(schema.learningPathMember.enrolledAt, monthStart.toISOString()))),
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .where(and(enrolledMember, inArray(schema.learningPathMember.roleId, [ROLE.ADMIN, ROLE.TUTOR]))),
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .where(and(enrolledStudent, eq(schema.learningPathMember.status, 'COMPLETED'))),
      dbClient
        .select({ courseId: schema.learningPathCourse.courseId })
        .from(schema.learningPathCourse)
        .where(
          and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
        )
    ]);

    const enrolled = Number(enrolledRows[0]?.count ?? 0);

    if (enrolled === 0) {
      return {
        enrolled: 0,
        newThisMonth: 0,
        tutorsCount: Number(tutorsRows[0]?.count ?? 0),
        activeLearners: 0,
        completionRate: 0,
        completedCount: 0,
        avgTimeToFinishDays: null
      };
    }

    const completedCount = Number(completedRows[0]?.count ?? 0);

    // Active learners: distinct student profiles with lesson_completion or submission in last 14 days
    const fourteenDaysAgo = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const courseIds = pathCourses.map((course) => course.courseId);

    if (courseIds.length === 0) {
      return {
        enrolled,
        newThisMonth: Number(newRows[0]?.count ?? 0),
        tutorsCount: Number(tutorsRows[0]?.count ?? 0),
        activeLearners: 0,
        completionRate: completedCount > 0 ? Math.round((completedCount / enrolled) * 100) : 0,
        completedCount,
        avgTimeToFinishDays: null
      };
    }

    // Active learners: active path learners (student role) with lesson/submission activity in
    // the last 14 days in any path course. Scoped to student members of THIS path, and
    // submission authors resolved to profiles via groupmember (submitted_by is
    // a groupmember id, not a profile id).
    const courseIdList = sql.join(
      courseIds.map((id) => sql`${id}`),
      sql`, `
    );
    const [activeLearnersResult, avgTimeResult] = await Promise.all([
      dbClient.execute(sql`
      SELECT COUNT(DISTINCT lpm.profile_id) as count
      FROM learning_path_member lpm
      WHERE lpm.learning_path_id = ${learningPathId}
        AND lpm.removed_at IS NULL
        AND lpm.profile_id IS NOT NULL
        AND lpm.role_id = ${ROLE.STUDENT}
        AND (
          EXISTS (
            SELECT 1
            FROM lesson_completion lc
            JOIN lesson l ON l.id = lc.lesson_id
            WHERE lc.profile_id = lpm.profile_id
              AND l.course_id IN (${courseIdList})
              AND lc.created_at >= ${fourteenDaysAgo.toISOString()}
          )
          OR EXISTS (
            SELECT 1
            FROM submission s
            JOIN groupmember gm ON gm.id = s.submitted_by
            WHERE gm.profile_id = lpm.profile_id
              AND s.course_id IN (${courseIdList})
              AND s.updated_at >= ${fourteenDaysAgo.toISOString()}
          )
        )
    `),
      // Avg time to finish (completed learners only, matching the enrolled base)
      // EXTRACT(EPOCH ...) yields seconds; divide by SECONDS_PER_DAY (24 * 60 * 60 = 86400) to get days.
      dbClient.execute(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - enrolled_at)) / ${SECONDS_PER_DAY}) as avg_days
      FROM learning_path_member
      WHERE learning_path_id = ${learningPathId}
        AND removed_at IS NULL
        AND role_id = ${ROLE.STUDENT}
        AND status = 'COMPLETED'
        AND completed_at IS NOT NULL
    `)
    ]);

    const activeLearners = Number(activeLearnersResult[0]?.count ?? 0);

    const avgTimeToFinishDays = avgTimeResult[0]?.avg_days ? Number(avgTimeResult[0].avg_days) : null;

    return {
      enrolled,
      newThisMonth: Number(newRows[0]?.count ?? 0),
      tutorsCount: Number(tutorsRows[0]?.count ?? 0),
      activeLearners,
      completionRate: enrolled > 0 ? Math.round((completedCount / enrolled) * 100) : 0,
      completedCount,
      avgTimeToFinishDays
    };
  } catch (error) {
    console.error('getPathAnalyticsSummary error:', error);
    throw new Error(
      `Failed to get analytics summary for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns per-course funnel stats with in-progress counts and drop-off calculations.
 */
export async function getPathCourseFunnelWithDropoff(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<TPathCourseFunnelRow[]> {
  try {
    // Only count cache rows belonging to enrolled (non-removed) student members.
    const isEnrolledStudent = sql`${schema.learningPathMember.id} IS NOT NULL AND ${schema.learningPathMember.roleId} = ${ROLE.STUDENT}`;
    const rows = await dbClient
      .select({
        learningPathCourseId: schema.learningPathCourse.id,
        courseId: schema.learningPathCourse.courseId,
        title: schema.course.title,
        order: schema.learningPathCourse.order,
        completedCount:
          sql<number>`SUM(CASE WHEN ${isEnrolledStudent} AND ${schema.learningPathMemberCourse.status} = 'COMPLETED' THEN 1 ELSE 0 END)`.as(
            'completedCount'
          ),
        inProgressCount:
          sql<number>`SUM(CASE WHEN ${isEnrolledStudent} AND ${schema.learningPathMemberCourse.status} = 'IN_PROGRESS' THEN 1 ELSE 0 END)`.as(
            'inProgressCount'
          )
      })
      .from(schema.learningPathCourse)
      .innerJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .leftJoin(
        schema.learningPathMemberCourse,
        and(eq(schema.learningPathMemberCourse.learningPathCourseId, schema.learningPathCourse.id))
      )
      .leftJoin(
        schema.learningPathMember,
        and(
          eq(schema.learningPathMember.id, schema.learningPathMemberCourse.learningPathMemberId),
          isNull(schema.learningPathMember.removedAt)
        )
      )
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .groupBy(
        schema.learningPathCourse.id,
        schema.learningPathCourse.courseId,
        schema.course.title,
        schema.learningPathCourse.order
      )
      .orderBy(schema.learningPathCourse.order);

    const funnel = rows.map((row) => ({
      learningPathCourseId: row.learningPathCourseId,
      courseId: row.courseId,
      title: row.title,
      order: row.order,
      completedCount: Number(row.completedCount ?? 0),
      inProgressCount: Number(row.inProgressCount ?? 0),
      droppedAfterPrevious: 0, // Computed below once the ordered rows are known
      completionRate: 0 // Computed below once total enrolled is known
    }));

    // Get total enrolled (learners only, matching the summary) for completion rate
    const [enrolledRows, certRows] = await Promise.all([
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .where(
          and(
            eq(schema.learningPathMember.learningPathId, learningPathId),
            isNull(schema.learningPathMember.removedAt),
            eq(schema.learningPathMember.roleId, ROLE.STUDENT)
          )
        ),
      // Total path certificates for learners (shown on the last funnel course).
      dbClient
        .select({ count: count(schema.learningPathCertificateIssue.id) })
        .from(schema.learningPathCertificateIssue)
        .innerJoin(
          schema.learningPathMember,
          eq(schema.learningPathCertificateIssue.learningPathMemberId, schema.learningPathMember.id)
        )
        .where(
          and(
            eq(schema.learningPathCertificateIssue.learningPathId, learningPathId),
            isNull(schema.learningPathMember.removedAt),
            eq(schema.learningPathMember.roleId, ROLE.STUDENT)
          )
        )
    ]);
    const totalEnrolled = Number(enrolledRows[0]?.count ?? 0);
    const certificatesAwarded = Number(certRows[0]?.count ?? 0);

    // Drop-off per the funnel definition: members who completed the previous
    // course but are neither completed nor in progress in this one.
    return funnel.map((funnelRow, index) => {
      if (index === 0) {
        return {
          ...funnelRow,
          droppedAfterPrevious: 0,
          completionRate: totalEnrolled > 0 ? Math.round((funnelRow.completedCount / totalEnrolled) * 100) : 0,
          certificatesAwarded: funnel.length === 1 ? certificatesAwarded : undefined
        };
      }

      const previous = funnel[index - 1];
      const reachedThisCourse = funnelRow.completedCount + funnelRow.inProgressCount;
      const droppedAfterPrevious = Math.max(0, previous.completedCount - reachedThisCourse);

      return {
        ...funnelRow,
        droppedAfterPrevious,
        completionRate: totalEnrolled > 0 ? Math.round((funnelRow.completedCount / totalEnrolled) * 100) : 0,
        certificatesAwarded: index === funnel.length - 1 ? certificatesAwarded : undefined
      };
    });
  } catch (error) {
    console.error('getPathCourseFunnelWithDropoff error:', error);
    throw new Error(
      `Failed to get course funnel for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns every active member in a path with profile and current-course details.
 * Powers the "Student progress overview" card on the Analytics tab, mirroring
 * the course analytics students table (no pagination — client paginates).
 */
export async function getPathAnalyticsStudents(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMemberWithProfile[]> {
  try {
    const rows = await dbClient
      .select({
        member: schema.learningPathMember,
        fullName: schema.profile.fullname,
        avatarUrl: schema.profile.avatarUrl,
        profileEmail: schema.profile.email,
        currentCourseTitle: schema.course.title,
        currentCourseOrder: schema.learningPathCourse.order
      })
      .from(schema.learningPathMember)
      .leftJoin(schema.profile, eq(schema.learningPathMember.profileId, schema.profile.id))
      .leftJoin(
        schema.learningPathCourse,
        and(
          eq(schema.learningPathMember.currentCourseId, schema.learningPathCourse.courseId),
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          isNull(schema.learningPathCourse.removedAt)
        )
      )
      .leftJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .where(
        and(eq(schema.learningPathMember.learningPathId, learningPathId), isNull(schema.learningPathMember.removedAt))
      )
      .orderBy(
        asc(schema.learningPathMember.roleId),
        asc(schema.learningPathMember.enrolledAt),
        asc(schema.learningPathMember.id)
      );

    return rows.map((row) => ({
      ...row.member,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      profileEmail: row.profileEmail ?? null,
      currentCourseTitle: row.currentCourseTitle,
      currentCourseOrder: row.currentCourseOrder
    }));
  } catch (error) {
    console.error('getPathAnalyticsStudents error:', error);
    throw new Error(
      `Failed to get analytics students for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns lessons and exercises blocking the most learners in a learning path.
 *
 * A learner is considered "stuck" if:
 * 1. They are enrolled in the learning path (student role, non-removed).
 * 2. They are currently in an IN_PROGRESS course that was started >= stuckThresholdDays ago.
 * 3. They have made NO progress in that course for >= stuckThresholdDays
 *    (no lesson completions and no exercise submissions in the last 14 days).
 *
 * For each stalled learner, the query determines their single current blocker:
 * the first uncompleted lesson or exercise in course syllabus order.
 *
 * Items are aggregated across all stalled learners, ordered by stuckCount descending,
 * and capped at `limit`.
 */
export async function getStuckItems(
  learningPathId: string,
  stuckThresholdDays: number = ACTIVE_WINDOW_DAYS,
  limit: number = STUCK_ITEMS_LIMIT,
  dbClient: DbOrTxClient = db
): Promise<TStuckItem[]> {
  try {
    const thresholdDate = new Date(Date.now() - stuckThresholdDays * 24 * 60 * 60 * 1000);
    const safeLimit = Math.max(1, limit);

    const result = await dbClient.execute(sql`
      WITH stalled_learners AS (
        -- Active student members in this path with an IN_PROGRESS course started >= thresholdDate
        -- and NO lesson completions or exercise submissions in that course in the last 14 days.
        SELECT 
          lpm.id AS member_id,
          lpm.profile_id,
          lpc.course_id,
          lpc.order AS course_order,
          c.title AS course_title
        FROM learning_path_member lpm
        JOIN learning_path_member_course lpmc ON lpmc.learning_path_member_id = lpm.id
          AND lpmc.status = 'IN_PROGRESS'
          AND lpmc.started_at <= ${thresholdDate.toISOString()}
        JOIN learning_path_course lpc ON lpc.id = lpmc.learning_path_course_id
          AND lpc.removed_at IS NULL
        JOIN course c ON c.id = lpc.course_id
        WHERE lpm.learning_path_id = ${learningPathId}
          AND lpm.removed_at IS NULL
          AND lpm.profile_id IS NOT NULL
          AND lpm.role_id = ${ROLE.STUDENT}
          AND NOT EXISTS (
            -- Any lesson completion in this course within the last 14 days
            SELECT 1
            FROM lesson_completion lc
            JOIN lesson l ON l.id = lc.lesson_id
            WHERE lc.profile_id = lpm.profile_id
              AND l.course_id = c.id
              AND lc.is_complete = true
              AND lc.created_at >= ${thresholdDate.toISOString()}
          )
          AND NOT EXISTS (
            -- Any submission in this course within the last 14 days
            SELECT 1
            FROM submission s
            JOIN groupmember gm ON gm.id = s.submitted_by
            WHERE gm.profile_id = lpm.profile_id
              AND s.course_id = c.id
              AND s.updated_at >= ${thresholdDate.toISOString()}
          )
      ),
      course_items AS (
        -- All trackable syllabus items (lessons and exercises) for the courses of stalled learners
        SELECT
          'lesson' AS item_type,
          l.id AS item_id,
          l.title AS item_title,
          l.course_id,
          COALESCE(cs.order, 999999) AS section_order,
          COALESCE(l.order, 0) AS item_order,
          0 AS sub_order,
          l.created_at AS item_created_at
        FROM lesson l
        LEFT JOIN course_section cs ON cs.id = l.section_id
        WHERE l.course_id IN (SELECT course_id FROM stalled_learners)

        UNION ALL

        SELECT
          'exercise' AS item_type,
          ex.id AS item_id,
          ex.title AS item_title,
          ex.course_id,
          COALESCE(cs.order, 999999) AS section_order,
          COALESCE(ex.order, 0) AS item_order,
          CASE WHEN ex.lesson_id IS NOT NULL THEN 1 ELSE 0 END AS sub_order,
          ex.created_at AS item_created_at
        FROM exercise ex
        LEFT JOIN course_section cs ON cs.id = ex.section_id
        WHERE ex.course_id IN (SELECT course_id FROM stalled_learners)
      ),
      uncompleted_items AS (
        -- Match stalled learners to uncompleted items and find the earliest blocker per learner
        SELECT
          sl.profile_id,
          sl.course_title,
          ci.item_type,
          ci.item_id,
          ci.item_title,
          ROW_NUMBER() OVER (
            PARTITION BY sl.profile_id
            ORDER BY 
              sl.course_order ASC,
              ci.section_order ASC NULLS LAST,
              ci.item_order ASC NULLS LAST,
              ci.item_created_at ASC NULLS LAST,
              ci.sub_order ASC,
              ci.item_id ASC
          ) AS item_rank
        FROM stalled_learners sl
        JOIN course_items ci ON ci.course_id = sl.course_id
        WHERE (
          ci.item_type = 'lesson' AND NOT EXISTS (
            SELECT 1
            FROM lesson_completion lc
            WHERE lc.lesson_id = ci.item_id
              AND lc.profile_id = sl.profile_id
              AND lc.is_complete = true
          )
        ) OR (
          ci.item_type = 'exercise' AND NOT EXISTS (
            SELECT 1
            FROM exercise ex
            JOIN submission cs ON cs.exercise_id = ex.id
            JOIN groupmember gm ON gm.id = cs.submitted_by
            WHERE ex.id = ci.item_id
              AND gm.profile_id = sl.profile_id
              AND ${submissionMeetsCompletionPolicySql('ex', 'cs')}
          )
        )
      )
      SELECT 
        item_type,
        item_id::text,
        item_title,
        course_title,
        COUNT(DISTINCT profile_id)::int AS stuck_count
      FROM uncompleted_items
      WHERE item_rank = 1
      GROUP BY item_type, item_id, item_title, course_title
      ORDER BY stuck_count DESC, item_title ASC
      LIMIT ${safeLimit}
    `);

    const toStuckItem = (row: Record<string, unknown>): TStuckItem => ({
      itemType: row.item_type as 'lesson' | 'exercise',
      itemId: String(row.item_id),
      itemTitle: String(row.item_title ?? ''),
      courseTitle: String(row.course_title ?? ''),
      stuckCount: Number(row.stuck_count ?? 0)
    });

    return (result as unknown as Record<string, unknown>[]).map(toStuckItem);
  } catch (error) {
    console.error('getStuckItems error:', error);
    throw new Error(
      `Failed to get stuck items for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
