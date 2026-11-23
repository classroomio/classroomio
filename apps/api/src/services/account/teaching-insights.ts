import { AppError, ErrorCodes } from '@api/utils/errors';
import { notifyLearnerNudged } from '@cio/core/services/notification/staff-events';
import { getGradableCoursesInOrg } from '@cio/db/queries/submission/grading-queue';
import { listLearnerActivity, type LearnerActivityCursor } from '@cio/db/queries/teaching/activity';
import {
  getLearnerProgressSummary,
  listLearnerProgress,
  type LearnerProgressRow
} from '@cio/db/queries/teaching/learner-progress';
import { isCourseStudent, recordLearnerNudge } from '@cio/db/queries/teaching/nudge';
import { listTeachingSessions } from '@cio/db/queries/teaching/sessions';
import {
  countUngradedSubmissions,
  getAverageGradedScore,
  listGradedSubmissions,
  listUpcomingExercises
} from '@cio/db/queries/teaching/submissions';
import type {
  TLearnerNudge,
  TTeachingActivityQuery,
  TTeachingLearnersQuery,
  TTeachingSessionsQuery,
  TTeachingSubmissionHistoryQuery
} from '@cio/utils/validation/account';

const DAY_MS = 24 * 60 * 60 * 1000;

export const ACTIVE_LEARNER_WINDOW_DAYS = 30;

export const NUDGE_INTERVAL_HOURS = 24;

const UPCOMING_SUBMISSIONS_LIMIT = 50;

export type TeachingScope = { orgId: string; profileId: string; isOrgAdmin: boolean };

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;

  return new AppError(error instanceof Error ? error.message : fallback, ErrorCodes.INTERNAL_ERROR, 500);
}

async function taughtCourseIds(scope: TeachingScope): Promise<string[]> {
  const courses = await getGradableCoursesInOrg(scope.orgId, scope.profileId, scope.isOrgAdmin);

  return courses.map((course) => course.id);
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function nextNudgeAt(lastNudgedAt: string | null): string | null {
  if (!lastNudgedAt) return null;

  const next = new Date(lastNudgedAt).getTime() + NUDGE_INTERVAL_HOURS * 60 * 60 * 1000;

  return next > Date.now() ? new Date(next).toISOString() : null;
}

function toLearnerItem(row: LearnerProgressRow) {
  return {
    profileId: row.profileId,
    fullname: row.fullname || row.username || row.email || '',
    email: row.email,
    avatarUrl: row.avatarUrl,
    course: { id: row.courseId, title: row.courseTitle },
    progressPercent: row.progressPercent,
    completed: row.completedAt !== null || row.progressPercent >= 100,
    enrolledAt: row.enrolledAt,
    lastActivityAt: row.lastActivityAt,
    needsNudge: row.needsNudge,
    nudgeReason: row.nudgeReason,
    failedExercise: row.failedExerciseId ? { id: row.failedExerciseId, title: row.failedExerciseTitle ?? '' } : null,
    lastNudgedAt: row.lastNudgedAt,
    nextNudgeAt: nextNudgeAt(row.lastNudgedAt)
  };
}

/**
 * The tutor home's key numbers across the courses the profile teaches (every org course for an org admin): learners
 * active in the last {@link ACTIVE_LEARNER_WINDOW_DAYS} days, average progress across enrollments, submissions
 * waiting for a grade and the average score of graded submissions (null when nothing has been graded).
 */
export async function getTeachingStats(scope: TeachingScope) {
  try {
    const courseIds = await taughtCourseIds(scope);
    const activeSince = new Date(Date.now() - ACTIVE_LEARNER_WINDOW_DAYS * DAY_MS);
    const [summary, itemsToReview, averageQuizScore] = await Promise.all([
      getLearnerProgressSummary(courseIds, activeSince),
      countUngradedSubmissions(courseIds),
      getAverageGradedScore(courseIds)
    ]);

    return {
      courses: courseIds.length,
      learners: summary.learners,
      activeLearners: summary.activeLearners,
      averageCompletion: summary.averageProgress,
      itemsToReview,
      averageQuizScore
    };
  } catch (error) {
    throw toAppError(error, 'Failed to load teaching stats');
  }
}

/** Live sessions in the taught courses that have not ended, soonest first, with registered and enrolled counts. */
export async function listUpcomingTeachingSessions(scope: TeachingScope, query: TTeachingSessionsQuery) {
  try {
    const courseIds = await taughtCourseIds(scope);
    const sessions = await listTeachingSessions({ courseIds, limit: query.limit });
    const now = Date.now();

    return sessions.map((session) => {
      const startsAt = new Date(session.lessonAt).getTime();
      const endsAt = startsAt + session.durationMinutes * 60 * 1000;

      return { ...session, isLive: startsAt <= now && now < endsAt };
    });
  } catch (error) {
    throw toAppError(error, 'Failed to load upcoming sessions');
  }
}

function encodeActivityCursor(item: { occurredAt: string; id: string }) {
  return Buffer.from(JSON.stringify({ occurredAt: item.occurredAt, id: item.id })).toString('base64url');
}

function parseActivityCursor(cursor: string): LearnerActivityCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<LearnerActivityCursor>;
    const valid =
      typeof parsed.occurredAt === 'string' &&
      typeof parsed.id === 'string' &&
      !Number.isNaN(Date.parse(parsed.occurredAt));

    return valid ? { occurredAt: parsed.occurredAt!, id: parsed.id! } : null;
  } catch {
    return null;
  }
}

/** Student events in the taught courses, newest first. `nextCursor` pages to older events. */
export async function listTeachingActivity(scope: TeachingScope, query: TTeachingActivityQuery) {
  try {
    const after = query.cursor ? parseActivityCursor(query.cursor) : undefined;
    if (after === null) {
      throw new AppError('Invalid cursor', ErrorCodes.VALIDATION_ERROR, 400, 'cursor');
    }

    const courseIds = await taughtCourseIds(scope);
    const items = await listLearnerActivity({ courseIds, limit: query.limit + 1, after });
    const page = items.slice(0, query.limit);
    const last = page.at(-1);

    return {
      items: page,
      nextCursor: items.length > query.limit && last ? encodeActivityCursor(last) : null
    };
  } catch (error) {
    throw toAppError(error, 'Failed to load recent activity');
  }
}

/** Exercises in the taught courses with a due date ahead, soonest first, with submitted and enrolled counts. */
export async function listUpcomingSubmissions(scope: TeachingScope) {
  try {
    const courseIds = await taughtCourseIds(scope);

    return await listUpcomingExercises({ courseIds, limit: UPCOMING_SUBMISSIONS_LIMIT });
  } catch (error) {
    throw toAppError(error, 'Failed to load upcoming submissions');
  }
}

/** Graded submissions in the taught courses, most recently graded first. */
export async function listSubmissionHistory(scope: TeachingScope, query: TTeachingSubmissionHistoryQuery) {
  try {
    const courseIds = await taughtCourseIds(scope);
    const scopedCourseIds = query.courseId ? courseIds.filter((id) => id === query.courseId) : courseIds;
    const { rows, total } = await listGradedSubmissions({
      courseIds: scopedCourseIds,
      limit: query.limit,
      offset: (query.page - 1) * query.limit
    });

    return { items: rows, pagination: pagination(query.page, query.limit, total) };
  } catch (error) {
    throw toAppError(error, 'Failed to load graded submissions');
  }
}

/**
 * Student enrollments in the taught courses with progress, last activity and nudge state. `needs-nudge` keeps
 * unfinished enrollments with no activity for a week or an exercise failed twice without a pass.
 */
export async function listTeachingLearners(scope: TeachingScope, query: TTeachingLearnersQuery) {
  try {
    const courseIds = await taughtCourseIds(scope);
    const scopedCourseIds = query.courseId ? courseIds.filter((id) => id === query.courseId) : courseIds;
    const { rows, total } = await listLearnerProgress({
      courseIds: scopedCourseIds,
      needsNudgeOnly: query.filter === 'needs-nudge',
      search: query.search || undefined,
      limit: query.limit,
      offset: (query.page - 1) * query.limit
    });

    return { items: rows.map(toLearnerItem), pagination: pagination(query.page, query.limit, total) };
  } catch (error) {
    throw toAppError(error, 'Failed to load learners');
  }
}

/**
 * Sends a learner a reminder from a tutor of the course: a push and an in-app notification. One nudge per learner per
 * course every {@link NUDGE_INTERVAL_HOURS} hours; a repeat inside that window throws `NUDGE_RATE_LIMITED` (429).
 * Throws 403 when the caller does not teach the course and 404 when the learner is not a student in it.
 */
export async function nudgeLearner(scope: TeachingScope, input: TLearnerNudge) {
  try {
    const courseIds = await taughtCourseIds(scope);
    if (!courseIds.includes(input.courseId)) {
      throw new AppError('You do not teach this course', ErrorCodes.FORBIDDEN, 403);
    }

    const enrolled = await isCourseStudent(input.courseId, input.profileId);
    if (!enrolled) {
      throw new AppError('This learner is not a student in the course', ErrorCodes.LEARNER_NOT_IN_COURSE, 404);
    }

    const result = await recordLearnerNudge({
      organizationId: scope.orgId,
      courseId: input.courseId,
      learnerProfileId: input.profileId,
      nudgedByProfileId: scope.profileId,
      windowStart: new Date(Date.now() - NUDGE_INTERVAL_HOURS * 60 * 60 * 1000)
    });

    if (!result.created) {
      throw new AppError(
        'This learner was already nudged in this course in the last 24 hours',
        ErrorCodes.NUDGE_RATE_LIMITED,
        429
      );
    }

    await notifyLearnerNudged({
      organizationId: scope.orgId,
      courseId: input.courseId,
      learnerProfileId: input.profileId,
      actorProfileId: scope.profileId,
      nudgeId: result.nudge.id
    });

    const nudgedAt = new Date(result.nudge.createdAt).toISOString();

    return {
      courseId: input.courseId,
      profileId: input.profileId,
      nudgedAt,
      nextNudgeAt: nextNudgeAt(nudgedAt)
    };
  } catch (error) {
    throw toAppError(error, 'Failed to nudge learner');
  }
}
