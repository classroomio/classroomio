import { enrollInCourse } from '@api/services/course/invite';
import { getPathLocksForProfile } from '@api/services/learning-path/learner';
import { getCoursePathLock } from '@api/services/learning-path/progress';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getEnrolledCourses } from '@cio/db/queries/course/course';
import { getExploreCourseDetail } from '@cio/db/queries/course/explore';
import {
  deleteLiveClassRegistration,
  getLiveClassLesson,
  insertLiveClassRegistration,
  listCatalogLiveClasses,
  listLiveClassesInCourses,
  type LiveClassRow
} from '@cio/db/queries/learner/live-classes';
import { LIVE_CLASS_JOIN_OPENS_MINUTES, LIVE_CLASS_LIST_LIMIT } from '@cio/utils/constants/live-class';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions';
import { getLiveSessionPhase } from '@cio/utils/functions/live-session';
import { toIsoTimestamp } from '@cio/utils/functions/learner-streak';
import { isCoursePaid } from '@cio/utils/validation/course';

const MINUTE_MS = 60_000;

type Learner = { id: string; email: string; emailVerified?: boolean };

type RequestContext = { ipAddress?: string | null; userAgent?: string | null };

function toLiveClass(row: LiveClassRow, isEnrolled: boolean, now: number) {
  const startMs = new Date(toIsoTimestamp(row.lessonAt) ?? row.lessonAt).getTime();
  const endsAt = new Date(startMs + row.durationMinutes * MINUTE_MS).toISOString();
  const phase = getLiveSessionPhase(
    { callUrl: row.callUrl, lessonAt: row.lessonAt, sessionDurationMinutes: row.durationMinutes },
    now
  );
  const canJoin = isEnrolled && phase !== 'ended' && now >= startMs - LIVE_CLASS_JOIN_OPENS_MINUTES * MINUTE_MS;
  const requiresPayment = isCoursePaid(row.courseCost, row.courseMetadata);

  return {
    lessonId: row.lessonId,
    title: row.lessonTitle,
    startsAt: new Date(startMs).toISOString(),
    endsAt,
    durationMinutes: row.durationMinutes,
    isLive: phase === 'live',
    sessionTimezone: row.sessionTimezone,
    hostName: row.hostName,
    course: { id: row.courseId, title: row.courseTitle, image: row.courseImage },
    isEnrolled,
    isRegistered: row.isRegistered,
    registeredCount: row.registeredCount,
    canRegister: isEnrolled || !requiresPayment,
    requiresPayment: !isEnrolled && requiresPayment,
    canJoin,
    callUrl: canJoin ? row.callUrl : null
  };
}

export type LearnerLiveClass = ReturnType<typeof toLiveClass>;

/**
 * Live classes in the learner's courses that have not ended, soonest first, with registration and join state.
 * Courses a learning path keeps locked for the learner are left out.
 */
export async function listLearnerLiveClasses(orgId: string, profileId: string): Promise<LearnerLiveClass[]> {
  const [courses, pathLocks] = await Promise.all([
    getEnrolledCourses({ orgId, profileId }),
    getPathLocksForProfile(orgId, profileId)
  ]);
  const courseIds = courses
    .filter((course) => course.isPublished && !pathLocks.has(course.id))
    .map((course) => course.id);
  const rows = await listLiveClassesInCourses({ courseIds, profileId, limit: LIVE_CLASS_LIST_LIMIT });
  const now = Date.now();

  return rows.map((row) => toLiveClass(row, true, now));
}

/** Upcoming live classes in catalog courses the learner can join from Explore. */
export async function listExploreLiveClasses(orgId: string, profileId: string): Promise<LearnerLiveClass[]> {
  const rows = await listCatalogLiveClasses({ orgId, profileId, limit: LIVE_CLASS_LIST_LIMIT });
  const now = Date.now();

  return rows.map((row) => toLiveClass(row, false, now));
}

async function getRegistrableLesson(orgId: string, lessonId: string) {
  const lesson = await getLiveClassLesson(lessonId);
  if (!lesson || lesson.organizationId !== orgId || !lesson.lessonAt || !lesson.callUrl || !lesson.isUnlocked) {
    throw new AppError('Live class not found', ErrorCodes.LIVE_CLASS_NOT_FOUND, 404);
  }

  const phase = getLiveSessionPhase({
    callUrl: lesson.callUrl,
    lessonAt: lesson.lessonAt,
    sessionDurationMinutes: lesson.sessionDurationMinutes
  });
  if (phase === 'ended') {
    throw new AppError('This live class has ended', ErrorCodes.LIVE_CLASS_ENDED, 400);
  }

  return lesson;
}

/**
 * Registers the learner for a live class. A learner who is not in the course joins it first, under the same rules
 * as joining from Explore: the course must allow self-enrollment and be free.
 */
export async function registerForLiveClass(
  orgId: string,
  learner: Learner,
  lessonId: string,
  context: RequestContext
): Promise<{ lessonId: string; courseId: string; isRegistered: true; enrolled: boolean }> {
  const lesson = await getRegistrableLesson(orgId, lessonId);
  const course = await getExploreCourseDetail({ orgId, profileId: learner.id, courseId: lesson.courseId });
  if (!course) {
    throw new AppError('Live class not found', ErrorCodes.LIVE_CLASS_NOT_FOUND, 404);
  }

  const pathLock = await getCoursePathLock(lesson.courseId, learner.id);
  if (pathLock) {
    throw new AppError(
      `Finish ${pathLock.blockingCourseTitle} to unlock this course`,
      ErrorCodes.LEARNING_PATH_COURSE_LOCKED,
      403
    );
  }

  const isEnrolled = course.groupMemberId !== null;
  if (!isEnrolled) {
    if (!isSelfEnrollmentAllowed(course.course.metadata)) {
      throw new AppError('Live class not found', ErrorCodes.LIVE_CLASS_NOT_FOUND, 404);
    }

    await enrollInCourse(lesson.courseId, learner, {}, context);
  }

  await insertLiveClassRegistration(lessonId, learner.id);

  return { lessonId, courseId: lesson.courseId, isRegistered: true, enrolled: !isEnrolled };
}

export async function unregisterFromLiveClass(
  orgId: string,
  profileId: string,
  lessonId: string
): Promise<{ lessonId: string; isRegistered: false }> {
  const lesson = await getLiveClassLesson(lessonId);
  if (!lesson || lesson.organizationId !== orgId) {
    throw new AppError('Live class not found', ErrorCodes.LIVE_CLASS_NOT_FOUND, 404);
  }

  await deleteLiveClassRegistration(lessonId, profileId);

  return { lessonId, isRegistered: false };
}
