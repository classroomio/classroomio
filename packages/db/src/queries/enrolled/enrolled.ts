import * as schema from '@db/schema';

import { and, asc, desc, eq, gt, ilike, lte, not, sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TStudentCourse } from '../course/course';
import {
  complianceCycleIsCompleteSql,
  courseIsCompleteSql,
  courseRecordedIsCompleteSql,
  latestComplianceCte,
  learnerCourseProgressCtes
} from '../course/learner-progress';
import { isUpcomingSessionLessonSql } from '../course/session';
import { pathCourseIsActiveSql } from '../learning-path/learning-path-course';
import { toContainsPattern } from '@db/utils/like-pattern';

export type TEnrolledKind = 'course' | 'learning_path';

export type TEnrolledKindFilter = 'all' | TEnrolledKind;

export type TEnrolledStatus = 'all' | 'not_started' | 'in_progress';

/**
 * Progress shared by both row kinds. Items are a course's lessons and
 * exercises, or a path's courses.
 */
export interface TEnrolledStats {
  /** Whole percent of completed items. 0 when the row has no items. */
  progress: number;
  completedItems: number;
  totalItems: number;
  /** Recorded completion (see `feedRowIsCompleteSql`). Completed rows leave the feed for `getEarnedCertificates`. */
  isComplete: boolean;
  /** The learner's latest lesson completion change or submission. Null before either. */
  lastProgressAt: string | null;
}

/** The enrolled course card row (`TStudentCourse`) plus its progress stats. */
export interface TEnrolledCourse extends TStudentCourse, TEnrolledStats {}

export interface TEnrolledPath extends TEnrolledStats {
  id: string;
  publicId: string;
  name: string;
  slug: string | null;
  description: string;
  coverImage: string | null;
  enrolledAt: string;
  completedAt: string | null;
}

export type TEnrolledItem = { kind: 'course'; data: TEnrolledCourse } | { kind: 'learning_path'; data: TEnrolledPath };

export interface TEnrolledPage {
  items: TEnrolledItem[];
  /** Rows matching the search, status and kind filters, for pagination. */
  total: number;
  /**
   * Faceted totals under the search filter. Each dimension ignores its
   * own filter but respects the other: `byStatus` is scoped by kind,
   * `byKind` is scoped by status. Completed rows are never returned, so
   * they are not counted.
   */
  counts: {
    byStatus: { notStarted: number; inProgress: number };
    byKind: { course: number; learningPath: number };
  };
}

interface GetEnrolledOptions {
  orgId: string;
  profileId: string;
  limit: number;
  page: number;
  status?: TEnrolledStatus;
  kind?: TEnrolledKindFilter;
  /** Case-insensitive match on course titles, and on path names or the titles of their courses. */
  search?: string;
}

/**
 * Whether a feed row is complete. Uses the completion that was saved, not
 * live progress, so finished work leaves My Learning for the Certificates
 * page. The one item on both is a compliance course whose certificate
 * lapsed: due again here, listed as expired there. A path is complete when its member status is
 * `COMPLETED`; a course follows `courseIsCompleteSql`. Reads the row's
 * `kind`, `member_status`, `course_type`, `completed_at` and
 * `compliance_complete`.
 */
function feedRowIsCompleteSql(): SQL {
  const courseIsComplete = courseIsCompleteSql({
    courseType: sql`course_type`,
    memberCompletedAt: sql`completed_at`,
    complianceCycleComplete: sql`compliance_complete`
  });

  return sql`CASE
    WHEN kind = 'learning_path' THEN member_status = 'COMPLETED'
    ELSE ${courseIsComplete}
  END`;
}

/**
 * Rows of the student's learning feed: one per path membership, and one per
 * course they take on their own (a live grant, outside every path they are
 * in, and not `enrollOnlyInLearningPath`). Progress is read at query time from
 * `lesson_completion` and `submission`, so joining or leaving a path moves the
 * same completed work between the path row and the course row. A path's
 * completed-courses count is what completion evaluation recorded, like the
 * journey and the completion cache.
 */
function enrolledFeedSql(orgId: string, profileId: string): SQL {
  return sql`
    WITH member_paths AS (
      SELECT lpm.learning_path_id, lp.name, lpm.enrolled_at, lpm.completed_at, lpm.status AS member_status
      FROM ${schema.learningPathMember} lpm
      JOIN ${schema.learningPath} lp ON lp.id = lpm.learning_path_id
      WHERE lpm.profile_id = ${profileId}
        AND lpm.removed_at IS NULL
        AND lpm.role_id = ${ROLE.STUDENT}
        AND lp.organization_id = ${orgId}
        AND lp.status = 'ACTIVE'
    ),
    path_courses AS (
      SELECT mp.learning_path_id, lpc.course_id, c.title
      FROM member_paths mp
      JOIN ${schema.learningPathCourse} lpc ON lpc.learning_path_id = mp.learning_path_id
      JOIN ${schema.course} c ON c.id = lpc.course_id AND ${pathCourseIsActiveSql({ link: sql`lpc`, course: sql`c` })}
    ),
    granted_courses AS (
      SELECT ceg.course_id, MIN(ceg.granted_at) AS enrolled_at
      FROM ${schema.courseEnrollmentGrant} ceg
      JOIN ${schema.course} c
        ON c.id = ceg.course_id AND c.status = 'ACTIVE' AND c.enroll_only_in_learning_path = false
      JOIN ${schema.group} g ON g.id = c.group_id AND g.organization_id = ${orgId}
      WHERE ceg.profile_id = ${profileId}
        AND ceg.revoked_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM path_courses pc WHERE pc.course_id = ceg.course_id)
      GROUP BY ceg.course_id
    ),
    tracked_courses AS (
      SELECT course_id FROM path_courses
      UNION
      SELECT course_id FROM granted_courses
    ),
    ${learnerCourseProgressCtes(profileId)},
    ${latestComplianceCte(profileId)},
    feed_rows AS (
      SELECT 'learning_path' AS kind,
        mp.learning_path_id AS item_id,
        -- A path matches a search on its own name or on any course folded into it.
        CONCAT_WS(' ', mp.name, STRING_AGG(pc.title, ' ')) AS search_text,
        NULL AS course_type,
        mp.enrolled_at,
        mp.completed_at,
        mp.member_status::text AS member_status,
        (COUNT(pc.course_id) FILTER (WHERE ${courseRecordedIsCompleteSql({
          courseType: sql`pc_course.type::text`,
          memberCompletedAt: sql`pc_member.completed_at`,
          complianceCycleComplete: complianceCycleIsCompleteSql(sql`pc_compliance`),
          lessonsTotal: sql`cp.lessons_total`,
          exercisesTotal: sql`cp.exercises_total`
        })}))::int AS completed_items,
        COUNT(cp.course_id)::int AS total_items,
        NULL::int AS lessons_total,
        NULL::int AS lessons_completed,
        NULL::int AS exercises_total,
        NULL::int AS exercises_completed,
        MAX(cp.last_progress_at) AS last_progress_at,
        NULL AS compliance_status,
        NULL::int AS compliance_cycle_number,
        NULL::timestamptz AS compliance_due_date,
        NULL::timestamptz AS compliance_valid_until,
        NULL::boolean AS compliance_complete
      FROM member_paths mp
      LEFT JOIN path_courses pc ON pc.learning_path_id = mp.learning_path_id
      LEFT JOIN course_progress cp ON cp.course_id = pc.course_id
      LEFT JOIN ${schema.course} pc_course ON pc_course.id = pc.course_id
      LEFT JOIN ${schema.groupmember} pc_member
        ON pc_member.group_id = pc_course.group_id AND pc_member.profile_id = ${profileId}
      LEFT JOIN latest_compliance pc_compliance ON pc_compliance.course_id = pc.course_id
      GROUP BY mp.learning_path_id, mp.name, mp.enrolled_at, mp.completed_at, mp.member_status
      UNION ALL
      SELECT 'course',
        gc.course_id,
        c.title,
        c.type::text,
        gc.enrolled_at,
        gm.completed_at,
        NULL,
        (cp.lessons_completed + cp.exercises_completed)::int,
        (cp.lessons_total + cp.exercises_total)::int,
        cp.lessons_total::int,
        cp.lessons_completed::int,
        cp.exercises_total::int,
        cp.exercises_completed::int,
        cp.last_progress_at,
        lc.status,
        lc.cycle_number,
        lc.due_date,
        lc.valid_until,
        ${complianceCycleIsCompleteSql(sql`lc`)}
      FROM granted_courses gc
      JOIN ${schema.course} c ON c.id = gc.course_id
      JOIN course_progress cp ON cp.course_id = gc.course_id
      LEFT JOIN ${schema.groupmember} gm ON gm.group_id = c.group_id AND gm.profile_id = ${profileId}
      LEFT JOIN latest_compliance lc ON lc.course_id = gc.course_id
    ),
    scored_rows AS (
      -- Same rounding as the dashboard (Math.round) and evaluatePathCompletion.
      SELECT fr.*,
        CASE WHEN fr.total_items > 0
          THEN ROUND(fr.completed_items * 100.0 / fr.total_items)::int
          ELSE 0
        END AS progress
      FROM feed_rows fr
    )
    -- Output columns carry a feed_ prefix: Drizzle references CTE columns
    -- unqualified, so they must not collide with columns of the joined tables.
    SELECT kind AS feed_kind,
      item_id AS feed_item_id,
      search_text AS feed_search_text,
      enrolled_at AS feed_enrolled_at,
      completed_at AS feed_completed_at,
      completed_items AS feed_completed_items,
      total_items AS feed_total_items,
      lessons_total AS feed_lessons_total,
      lessons_completed AS feed_lessons_completed,
      exercises_total AS feed_exercises_total,
      exercises_completed AS feed_exercises_completed,
      progress AS feed_progress,
      ${feedRowIsCompleteSql()} AS feed_is_complete,
      last_progress_at AS feed_last_progress_at,
      compliance_status AS feed_compliance_status,
      compliance_cycle_number AS feed_compliance_cycle_number,
      compliance_due_date AS feed_compliance_due_date,
      compliance_valid_until AS feed_compliance_valid_until
    FROM scored_rows
  `;
}

type TFeedOrderColumns = Record<'lastProgressAt' | 'enrolledAt' | 'kind' | 'itemId', SQL.Aliased>;

/**
 * Most recent activity first, rows without activity last by newest enrollment.
 * Kind and id make the order total so pages never overlap.
 */
function feedOrderBy(columns: TFeedOrderColumns): SQL[] {
  return [
    sql`${columns.lastProgressAt} DESC NULLS LAST`,
    desc(columns.enrolledAt),
    asc(columns.kind),
    asc(columns.itemId)
  ];
}

/**
 * One page of the student's courses and learning paths in an organization,
 * most recently active first.
 *
 * Runs as a single statement: the feed CTE computes progress for every row,
 * then only the requested page is joined to its course or path details.
 * Totals come from a one-row CTE the page is left-joined onto, so a page
 * past the end still reports them.
 */
export async function getEnrolled(
  { orgId, profileId, limit, page, status = 'all', kind = 'all', search }: GetEnrolledOptions,
  dbClient: DbOrTxClient = db
): Promise<TEnrolledPage> {
  try {
    const feed = dbClient
      .$with('enrolled_feed', {
        kind: sql<TEnrolledKind>`feed_kind`.as('feed_kind'),
        itemId: sql<string>`feed_item_id`.as('feed_item_id'),
        searchText: sql<string>`feed_search_text`.as('feed_search_text'),
        enrolledAt: sql<string>`feed_enrolled_at`.as('feed_enrolled_at'),
        completedAt: sql<string | null>`feed_completed_at`.as('feed_completed_at'),
        completedItems: sql<number>`feed_completed_items`.as('feed_completed_items'),
        totalItems: sql<number>`feed_total_items`.as('feed_total_items'),
        lessonsTotal: sql<number | null>`feed_lessons_total`.as('feed_lessons_total'),
        lessonsCompleted: sql<number | null>`feed_lessons_completed`.as('feed_lessons_completed'),
        exercisesTotal: sql<number | null>`feed_exercises_total`.as('feed_exercises_total'),
        exercisesCompleted: sql<number | null>`feed_exercises_completed`.as('feed_exercises_completed'),
        progress: sql<number>`feed_progress`.as('feed_progress'),
        isComplete: sql<boolean>`feed_is_complete`.as('feed_is_complete'),
        lastProgressAt: sql<string | null>`feed_last_progress_at`.as('feed_last_progress_at'),
        complianceStatus: sql<string | null>`feed_compliance_status`.as('feed_compliance_status'),
        complianceCycleNumber: sql<number | null>`feed_compliance_cycle_number`.as('feed_compliance_cycle_number'),
        complianceDueDate: sql<string | null>`feed_compliance_due_date`.as('feed_compliance_due_date'),
        complianceValidUntil: sql<string | null>`feed_compliance_valid_until`.as('feed_compliance_valid_until')
      })
      .as(enrolledFeedSql(orgId, profileId));

    const trimmedSearch = search?.trim();
    const matchesSearch = trimmedSearch ? ilike(feed.searchText, toContainsPattern(trimmedSearch)) : undefined;
    const excludeCompleted = not(feed.isComplete);
    const matchesNotStarted = and(excludeCompleted, lte(feed.progress, 0));
    const matchesInProgress = and(excludeCompleted, gt(feed.progress, 0));
    const matchesStatus =
      status === 'not_started' ? matchesNotStarted : status === 'in_progress' ? matchesInProgress : excludeCompleted;
    const matchesKind =
      kind === 'course'
        ? eq(feed.kind, 'course')
        : kind === 'learning_path'
          ? eq(feed.kind, 'learning_path')
          : undefined;
    const matchesCourseKind = eq(feed.kind, 'course');
    const matchesPathKind = eq(feed.kind, 'learning_path');

    const feedTotals = dbClient.$with('enrolled_totals').as(
      dbClient
        .select({
          total: sql<number>`(COUNT(*) FILTER (WHERE ${and(matchesStatus, matchesKind)}))::int`.as('feed_total'),
          notStarted: sql<number>`(COUNT(*) FILTER (WHERE ${and(matchesNotStarted, matchesKind)}))::int`.as(
            'feed_not_started'
          ),
          inProgress: sql<number>`(COUNT(*) FILTER (WHERE ${and(matchesInProgress, matchesKind)}))::int`.as(
            'feed_in_progress'
          ),
          course: sql<number>`(COUNT(*) FILTER (WHERE ${and(matchesStatus, matchesCourseKind)}))::int`.as(
            'feed_course'
          ),
          learningPath: sql<number>`(COUNT(*) FILTER (WHERE ${and(matchesStatus, matchesPathKind)}))::int`.as(
            'feed_learning_path'
          )
        })
        .from(feed)
        .where(matchesSearch)
    );

    const feedPage = dbClient.$with('enrolled_page').as(
      dbClient
        .select()
        .from(feed)
        .where(and(matchesSearch, matchesStatus, matchesKind))
        .orderBy(...feedOrderBy(feed))
        .limit(limit)
        .offset((page - 1) * limit)
    );

    const now = new Date().toISOString();
    const upcomingSession = dbClient
      .select({
        lessonId: schema.lesson.id,
        lessonTitle: schema.lesson.title,
        callUrl: schema.lesson.callUrl,
        lessonAt: schema.lesson.lessonAt
      })
      .from(schema.lesson)
      .where(
        and(
          eq(schema.lesson.courseId, schema.course.id),
          // getEnrolledCourses only looks up sessions for live classes.
          eq(schema.course.type, 'LIVE_CLASS'),
          isUpcomingSessionLessonSql(now)
        )
      )
      .orderBy(asc(schema.lesson.lessonAt))
      .limit(1)
      .as('upcoming_session');

    const rows = await dbClient
      .with(feed, feedTotals, feedPage)
      .select({
        total: feedTotals.total,
        notStartedCount: feedTotals.notStarted,
        inProgressCount: feedTotals.inProgress,
        courseCount: feedTotals.course,
        learningPathCount: feedTotals.learningPath,
        kind: feedPage.kind,
        enrolledAt: feedPage.enrolledAt,
        completedAt: feedPage.completedAt,
        completedItems: feedPage.completedItems,
        totalItems: feedPage.totalItems,
        lessonsTotal: feedPage.lessonsTotal,
        lessonsCompleted: feedPage.lessonsCompleted,
        exercisesTotal: feedPage.exercisesTotal,
        exercisesCompleted: feedPage.exercisesCompleted,
        progress: feedPage.progress,
        isComplete: feedPage.isComplete,
        lastProgressAt: feedPage.lastProgressAt,
        complianceStatus: feedPage.complianceStatus,
        complianceCycleNumber: feedPage.complianceCycleNumber,
        complianceDueDate: feedPage.complianceDueDate,
        complianceValidUntil: feedPage.complianceValidUntil,
        course: schema.course,
        certificateEarnedAt: schema.groupmember.certificateEarnedAt,
        upcomingLessonId: upcomingSession.lessonId,
        upcomingLessonTitle: upcomingSession.lessonTitle,
        upcomingCallUrl: upcomingSession.callUrl,
        upcomingLessonAt: upcomingSession.lessonAt,
        path: {
          id: schema.learningPath.id,
          publicId: schema.learningPath.publicId,
          name: schema.learningPath.name,
          slug: schema.learningPath.slug,
          description: schema.learningPath.description,
          coverImage: schema.learningPath.coverImage
        }
      })
      .from(feedTotals)
      .leftJoin(feedPage, sql`true`)
      .leftJoin(schema.course, and(eq(feedPage.kind, 'course'), eq(schema.course.id, feedPage.itemId)))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.profileId, profileId))
      )
      .leftJoinLateral(upcomingSession, sql`true`)
      .leftJoin(
        schema.learningPath,
        and(eq(feedPage.kind, 'learning_path'), eq(schema.learningPath.id, feedPage.itemId))
      )
      // The join above does not keep the page CTE's order, so apply it again.
      .orderBy(...feedOrderBy(feedPage));

    const [totals] = rows;
    const items: TEnrolledItem[] = [];

    for (const row of rows) {
      // A page past the end still yields the totals row, with every page column null.
      if (!row.kind) continue;

      const stats: TEnrolledStats = {
        progress: row.progress,
        completedItems: row.completedItems,
        totalItems: row.totalItems,
        isComplete: row.isComplete,
        lastProgressAt: row.lastProgressAt
      };

      if (row.kind === 'course' && row.course) {
        const upcomingSession =
          row.upcomingLessonId && row.upcomingLessonTitle && row.upcomingCallUrl && row.upcomingLessonAt
            ? {
                lessonId: row.upcomingLessonId,
                lessonTitle: row.upcomingLessonTitle,
                callUrl: row.upcomingCallUrl,
                lessonAt: row.upcomingLessonAt,
                sessionTimezone: row.course.metadata?.sessionTimezone ?? null
              }
            : null;

        items.push({
          kind: 'course',
          data: {
            ...row.course,
            lessonCount: row.lessonsTotal ?? 0,
            exerciseCount: row.exercisesTotal ?? 0,
            progressRate: row.lessonsCompleted ?? 0,
            exercisesCompleted: row.exercisesCompleted ?? 0,
            certificateEarnedAt: row.certificateEarnedAt ?? null,
            completedAt: row.completedAt ?? null,
            complianceStatus: row.complianceStatus,
            complianceCycleNumber: row.complianceCycleNumber,
            complianceDueDate: row.complianceDueDate,
            complianceValidUntil: row.complianceValidUntil,
            upcomingSession,
            ...stats
          }
        });
        continue;
      }

      if (row.kind === 'learning_path' && row.path) {
        items.push({
          kind: 'learning_path',
          data: {
            ...row.path,
            enrolledAt: row.enrolledAt,
            completedAt: row.completedAt,
            ...stats
          }
        });
      }
    }

    return {
      items,
      total: totals?.total ?? 0,
      counts: {
        byStatus: { notStarted: totals?.notStartedCount ?? 0, inProgress: totals?.inProgressCount ?? 0 },
        byKind: { course: totals?.courseCount ?? 0, learningPath: totals?.learningPathCount ?? 0 }
      }
    };
  } catch (error) {
    console.error('getEnrolled error:', error);
    throw new Error(`Failed to get enrolled: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
