import * as schema from '@db/schema';

import { sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants';
import {
  complianceCycleIsCompleteSql,
  courseRecordedIsCompleteSql,
  latestComplianceCte,
  learnerCourseProgressCtes
} from '../course/learner-progress';

export type TPathJourneyCourseStatus = 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface TPathJourneyCourse {
  courseId: string;
  /** 1-based place in the path ("Course 3 of 5"). */
  position: number;
  title: string;
  description: string;
  slug: string | null;
  logo: string;
  type: string;
  /** Same rule as the member course cache written by syncPathProgressForMember. */
  status: TPathJourneyCourseStatus;
  isUnlocked: boolean;
  /** Recorded course completion (a course with no content counts); progress stays live. */
  isComplete: boolean;
  /** Whole percent of lessons and exercises done; 100 for a course with neither, as the cache stores it. */
  progress: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  /** Latest lesson completion change or submission in this course. */
  lastProgressAt: string | null;
}

export interface TPathJourneyRows {
  courses: TPathJourneyCourse[];
  /** Latest progress in any of the path's courses. */
  lastProgressAt: string | null;
}

interface GetPathJourneyOptions {
  pathId: string;
  profileId: string;
  sequentialUnlock: boolean;
}

type TPathJourneyRow = {
  course_id: string | null;
  position: number | null;
  title: string | null;
  description: string | null;
  slug: string | null;
  logo: string | null;
  type: string | null;
  lessons_total: number | null;
  lessons_completed: number | null;
  exercises_total: number | null;
  exercises_completed: number | null;
  last_progress_at: string | null;
  is_complete: boolean | null;
  is_unlocked: boolean | null;
  path_last_progress_at: string | null;
};

/** Whole-percent course progress; a course with no items counts 100, like the cache. */
function toCourseProgress(completed: number, total: number): number {
  if (total <= 0) return 100;

  return Math.round((completed / total) * 100);
}

/** Journey status from completion first, then progress, then lock state. */
function toCourseStatus(isComplete: boolean, progress: number, isUnlocked: boolean): TPathJourneyCourseStatus {
  if (isComplete) return 'COMPLETED';
  if (progress > 0) return 'IN_PROGRESS';

  return isUnlocked ? 'NOT_STARTED' : 'LOCKED';
}

/**
 * One learner's journey through a path in a single statement: every active
 * course in path order with live progress (the same CTEs as the enrolled
 * feed), recorded completion, and unlock state. A path with no courses still
 * returns one row, so the hub renders instead of 404ing.
 */
export async function getPathJourney(
  { pathId, profileId, sequentialUnlock }: GetPathJourneyOptions,
  dbClient: DbOrTxClient = db
): Promise<TPathJourneyRows> {
  try {
    const rows = await dbClient.execute<TPathJourneyRow>(sql`
      WITH tracked_courses AS (
        SELECT lpc.course_id, lpc."order", lpc.added_at
        FROM ${schema.learningPathCourse} lpc
        JOIN ${schema.course} c ON c.id = lpc.course_id AND c.status = 'ACTIVE'
        WHERE lpc.learning_path_id = ${pathId} AND lpc.removed_at IS NULL
      ),
      ${learnerCourseProgressCtes(profileId)},
      ${latestComplianceCte(profileId)},
      journey_courses AS (
        SELECT tc.course_id, tc."order", tc.added_at,
          c.title, c.description, c.slug, c.logo, c.type::text AS type,
          cp.lessons_total::int AS lessons_total,
          cp.lessons_completed::int AS lessons_completed,
          cp.exercises_total::int AS exercises_total,
          cp.exercises_completed::int AS exercises_completed,
          cp.last_progress_at,
          ${courseRecordedIsCompleteSql({
            courseType: sql`c.type::text`,
            memberCompletedAt: sql`gm.completed_at`,
            complianceCycleComplete: complianceCycleIsCompleteSql(sql`lc`),
            lessonsTotal: sql`cp.lessons_total`,
            exercisesTotal: sql`cp.exercises_total`
          })} AS is_complete
        FROM tracked_courses tc
        JOIN ${schema.course} c ON c.id = tc.course_id
        JOIN course_progress cp ON cp.course_id = tc.course_id
        LEFT JOIN ${schema.groupmember} gm ON gm.group_id = c.group_id AND gm.profile_id = ${profileId}
        LEFT JOIN latest_compliance lc ON lc.course_id = tc.course_id
      ),
      ordered_courses AS (
        -- Sequential unlock: a course opens once every course before it is complete.
        SELECT jc.*,
          ROW_NUMBER() OVER path_order AS position,
          COALESCE(
            BOOL_AND(jc.is_complete) OVER (path_order ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),
            true
          ) AS previous_complete
        FROM journey_courses jc
        WINDOW path_order AS (ORDER BY jc."order", jc.added_at, jc.course_id)
      )
      SELECT oc.course_id, oc.position::int AS position, oc.title, oc.description, oc.slug, oc.logo, oc.type,
        oc.lessons_total, oc.lessons_completed, oc.exercises_total, oc.exercises_completed,
        oc.last_progress_at, oc.is_complete,
        (NOT ${sequentialUnlock} OR oc.previous_complete) AS is_unlocked,
        MAX(oc.last_progress_at) OVER () AS path_last_progress_at
      FROM (SELECT 1) AS single_row
      LEFT JOIN ordered_courses oc ON true
      ORDER BY oc.position
    `);

    const [first] = rows;

    const courses = rows.flatMap((row): TPathJourneyCourse[] => {
      // A path with no courses yields one row carrying no course.
      if (!row.course_id) return [];

      const lessonsTotal = row.lessons_total ?? 0;
      const lessonsCompleted = row.lessons_completed ?? 0;
      const exercisesTotal = row.exercises_total ?? 0;
      const exercisesCompleted = row.exercises_completed ?? 0;
      const isComplete = Boolean(row.is_complete);
      const isUnlocked = Boolean(row.is_unlocked);
      const progress = toCourseProgress(lessonsCompleted + exercisesCompleted, lessonsTotal + exercisesTotal);

      return [
        {
          courseId: row.course_id,
          position: row.position ?? 0,
          title: row.title ?? '',
          description: row.description ?? '',
          slug: row.slug,
          logo: row.logo ?? '',
          type: row.type ?? '',
          status: toCourseStatus(isComplete, progress, isUnlocked),
          isUnlocked,
          isComplete,
          progress,
          lessonsCompleted,
          lessonsTotal,
          exercisesCompleted,
          exercisesTotal,
          lastProgressAt: row.last_progress_at
        }
      ];
    });

    const lastProgressAt = first?.path_last_progress_at ?? null;

    return { courses, lastProgressAt };
  } catch (error) {
    console.error('getPathJourney error:', error);
    throw new Error(
      `Failed to get journey for learning path "${pathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface TLearnerPathSummaryCourse {
  courseId: string;
  title: string;
  order: number;
  isComplete: boolean;
}

export interface TLearnerPathSummary {
  pathId: string;
  publicId: string | null;
  name: string;
  memberStatus: string;
  courses: TLearnerPathSummaryCourse[];
}

type TLearnerPathSummaryRow = {
  path_id: string;
  public_id: string | null;
  path_name: string;
  member_status: string;
  course_id: string | null;
  course_title: string | null;
  course_order: number | null;
  is_complete: boolean | null;
};

/**
 * One learner's path summaries in a single statement: every STUDENT,
 * non-removed membership in an ACTIVE org path with its ACTIVE courses in
 * path order and each course's recorded completion (the same rule as the
 * enrolled feed and the journey). Tutors, removed memberships, and
 * inactive courses are excluded.
 */
export async function getLearnerPathSummaries(
  input: { orgId: string; profileId: string; limit: number },
  dbClient: DbOrTxClient = db
): Promise<TLearnerPathSummary[]> {
  try {
    const rows = await dbClient.execute<TLearnerPathSummaryRow>(sql`
      WITH member_paths AS (
        SELECT lpm.learning_path_id, lpm.status AS member_status, lpm.enrolled_at,
          lp.public_id, lp.name AS path_name
        FROM ${schema.learningPathMember} lpm
        JOIN ${schema.learningPath} lp ON lp.id = lpm.learning_path_id
        WHERE lpm.profile_id = ${input.profileId}
          AND lpm.removed_at IS NULL
          AND lpm.role_id = ${ROLE.STUDENT}
          AND lp.organization_id = ${input.orgId}
          AND lp.status = 'ACTIVE'
        ORDER BY lpm.enrolled_at DESC, lp.id ASC
        LIMIT ${input.limit}
      ),
      tracked_courses AS (
        SELECT DISTINCT lpc.course_id
        FROM member_paths mp
        JOIN ${schema.learningPathCourse} lpc
          ON lpc.learning_path_id = mp.learning_path_id AND lpc.removed_at IS NULL
        JOIN ${schema.course} c ON c.id = lpc.course_id AND c.status = 'ACTIVE'
      ),
      ${learnerCourseProgressCtes(input.profileId)},
      ${latestComplianceCte(input.profileId)}
      SELECT mp.learning_path_id AS path_id, mp.public_id, mp.path_name, mp.member_status,
        c.id AS course_id, c.title AS course_title, lpc."order" AS course_order,
        (${courseRecordedIsCompleteSql({
          courseType: sql`c.type::text`,
          memberCompletedAt: sql`gm.completed_at`,
          complianceCycleComplete: complianceCycleIsCompleteSql(sql`lc`),
          lessonsTotal: sql`cp.lessons_total`,
          exercisesTotal: sql`cp.exercises_total`
        })}) AS is_complete
      FROM member_paths mp
      LEFT JOIN ${schema.learningPathCourse} lpc
        ON lpc.learning_path_id = mp.learning_path_id AND lpc.removed_at IS NULL
      LEFT JOIN ${schema.course} c ON c.id = lpc.course_id AND c.status = 'ACTIVE'
      LEFT JOIN course_progress cp ON cp.course_id = lpc.course_id
      LEFT JOIN latest_compliance lc ON lc.course_id = lpc.course_id
      LEFT JOIN ${schema.groupmember} gm ON gm.group_id = c.group_id AND gm.profile_id = ${input.profileId}
      ORDER BY mp.enrolled_at DESC, mp.learning_path_id ASC, lpc."order", lpc.added_at, lpc.course_id
    `);

    const byPath = new Map<string, TLearnerPathSummary>();

    for (const row of rows) {
      let summary = byPath.get(row.path_id);

      if (!summary) {
        summary = {
          pathId: row.path_id,
          publicId: row.public_id,
          name: row.path_name,
          memberStatus: row.member_status,
          courses: []
        };
        byPath.set(row.path_id, summary);
      }

      if (row.course_id) {
        summary.courses.push({
          courseId: row.course_id,
          title: row.course_title ?? '',
          order: row.course_order ?? 0,
          isComplete: Boolean(row.is_complete)
        });
      }
    }

    return [...byPath.values()];
  } catch (error) {
    console.error('getLearnerPathSummaries error:', error);
    throw new Error(
      `Failed to get learner path summaries for profile "${input.profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
