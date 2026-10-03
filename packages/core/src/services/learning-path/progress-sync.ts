import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getProfileById } from '@cio/db/queries/auth';
import {
  getCourseCompletionStatsForProfile,
  getCourseIdsInPath,
  getLearningPathById,
  getLearningPathCertificate,
  getMemberByPathAndProfile,
  getPathsContainingCourseForMember,
  getSingleMemberCourseProgress,
  issueLearningPathCertificate,
  listActivePathMemberIds,
  listLearningPathCourses,
  listMembersForProgressReconcile,
  updateMemberProgress,
  upsertMemberCourseProgress
} from '@cio/db/queries/learning-path';
import { getOrganizationById } from '@cio/db/queries/organization';
import type { TLearningPath } from '@cio/db/types';
import { trackServerEvent, SERVER_EVENTS } from '@cio/analytics';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import type { TLearningPathProgressReconcilePayload, TLearningPathProgressSyncPayload } from '@cio/jobs';
import { ROLE } from '@cio/utils/constants';

import { orgHasCertificatesEnabled } from '../organization/plan-features';
import { mapWithConcurrency } from './fanout';
import { buildLearningPathLoginUrl } from './path-invite-utils';
import { enqueueWorkerTemplateEmail } from './template-email';

/**
 * Learning-path progress sync, shared by the API (after learner events) and
 * the worker (path-wide and reconcile syncs). Truth is `lesson_completion` and
 * `submission`; this writes the `learning_path_member` and
 * `learning_path_member_course` caches that People, analytics and the member
 * detail page read, and it is where a path is marked complete, its
 * certificate issued and its completion email sent.
 */

export interface TProgressSyncOptions {
  /**
   * Stamp `learning_path_member.lastActivityAt` (shown as "last activity").
   * Only learner actions should: grading, resets and reconcile syncs pass false.
   */
  recordActivity?: boolean;
}

/**
 * Checks whether a single course is complete for a student within a learning path.
 * A course is complete when all lessons are completed AND all exercises are completed.
 */
export async function courseCompleteForPath(
  profileId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  const stats = await getCourseCompletionStatsForProfile(courseId, profileId, dbClient);
  return stats.isComplete;
}

/**
 * Returns the list of unlocked course IDs for a student in a learning path.
 * If sequentialUnlock is false, all courses are unlocked.
 * If sequentialUnlock is true, courses are unlocked up to the first incomplete course.
 */
export async function unlockedCourses(
  path: Pick<TLearningPath, 'sequentialUnlock'> & { courseIds: string[] },
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  if (!path.sequentialUnlock) {
    return path.courseIds;
  }

  const unlocked: string[] = [];
  for (const courseId of path.courseIds) {
    unlocked.push(courseId);
    const isComplete = await courseCompleteForPath(profileId, courseId, dbClient);
    if (!isComplete) {
      break;
    }
  }

  return unlocked;
}

export interface TPathCompletionResult {
  isComplete: boolean;
  completedAt: string | null;
  certificateId: string | null;
  progressPercent: number;
}

/**
 * Sends the learning-path completion email. Call only on first completion —
 * the caller guards with `isFirstCompletion`. Fire-and-forget: delivery
 * failure only logs.
 */
async function sendCompletionEmail(
  path: TLearningPath,
  memberId: string,
  profileId: string,
  certificateId: string | null
): Promise<void> {
  try {
    const studentProfile = await getProfileById(profileId);

    if (!studentProfile?.email) {
      return;
    }

    const organization = await getOrganizationById(path.organizationId);

    if (!organization) {
      return;
    }

    const loginUrl = buildLearningPathLoginUrl(organization, path);
    const branding = buildEmailBranding(organization);
    const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);

    await enqueueWorkerTemplateEmail('studentLearningPathCompletion', {
      to: studentProfile.email,
      fields: {
        orgName: organization.name,
        learningPathName: path.name || 'Learning path',
        studentName: studentProfile.fullname || studentProfile.email,
        loginUrl,
        certificateAvailable: Boolean(certificateId),
        branding
      },
      from,
      idempotencyKey: `learning-path-completion:${memberId}`,
      preference: { organizationId: organization.id, recipientProfileId: profileId }
    });
  } catch (error) {
    console.error('sendCompletionEmail error', { pathId: path.id, profileId }, error);
  }
}

/**
 * Evaluates completion status and progress of a student in a learning path.
 * If all courses are complete, marks the member row COMPLETED and issues a certificate (if enabled).
 */
export async function evaluatePathCompletion(
  pathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db,
  { recordActivity = true }: TProgressSyncOptions = {}
): Promise<TPathCompletionResult> {
  const path = await getLearningPathById(pathId, dbClient);
  const member = path ? await getMemberByPathAndProfile(path.id, profileId, dbClient) : null;

  if (!path || !member) {
    return {
      isComplete: false,
      completedAt: null,
      certificateId: null,
      progressPercent: 0
    };
  }

  const courseIds = await getCourseIdsInPath(path.id, dbClient);
  if (courseIds.length === 0) {
    return {
      isComplete: false,
      completedAt: null,
      certificateId: null,
      progressPercent: 0
    };
  }

  let completedCount = 0;
  let currentCourseId: string | null = null;

  for (const courseId of courseIds) {
    const isComplete = await courseCompleteForPath(profileId, courseId, dbClient);
    if (isComplete) {
      completedCount++;
    } else if (!currentCourseId) {
      currentCourseId = courseId;
    }
  }

  if (!currentCourseId && courseIds.length > 0) {
    currentCourseId = courseIds[courseIds.length - 1];
  }

  const progressPercent = Math.round((completedCount * 100) / courseIds.length);
  const isComplete = completedCount === courseIds.length;

  if (isComplete) {
    const nowIso = new Date().toISOString();
    const completedAt = member.completedAt ?? nowIso;
    const isFirstCompletion = !member.completedAt || member.status !== 'COMPLETED';

    if (isFirstCompletion) {
      await updateMemberProgress(
        member.id,
        {
          status: 'COMPLETED',
          completedAt,
          progressPercent: 100,
          completedCourseCount: completedCount,
          currentCourseId: currentCourseId ?? undefined,
          ...(recordActivity ? { lastActivityAt: nowIso } : {})
        },
        dbClient
      );
    }

    let certificateId: string | null = null;
    const certificatesEnabled = await orgHasCertificatesEnabled(path.organizationId);

    if (certificatesEnabled && path.certificate?.isDownloadable) {
      const existingCert = await getLearningPathCertificate(member.id, dbClient);
      if (existingCert) {
        certificateId = existingCert.certificateId;
      } else {
        const organization = await getOrganizationById(path.organizationId, dbClient);
        const certificateTitle = path.name;
        const certificateIssuer = organization?.name ?? '';
        const idFormat = path.certificate?.design?.idFormat;

        const cert = await issueLearningPathCertificate(
          {
            learningPathId: path.id,
            learningPathMemberId: member.id,
            profileId,
            title: certificateTitle,
            issuer: certificateIssuer,
            idFormat
          },
          dbClient
        );
        certificateId = cert.certificateId;
      }
    }

    if (isFirstCompletion) {
      trackServerEvent({
        eventType: SERVER_EVENTS.COURSE_COMPLETED,
        orgId: path.organizationId,
        userId: profileId,
        props: { path: 'learning-path', learningPathId: path.id }
      });

      if (certificateId) {
        trackServerEvent({
          eventType: SERVER_EVENTS.CERTIFICATE_ISSUED,
          orgId: path.organizationId,
          userId: profileId,
          props: { path: 'learning-path', learningPathId: path.id, certificateId }
        });
      }

      void sendCompletionEmail(path, member.id, profileId, certificateId);
    }

    return {
      isComplete: true,
      completedAt,
      certificateId,
      progressPercent: 100
    };
  }

  // Path is in progress or not started
  const newStatus = completedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

  await updateMemberProgress(
    member.id,
    {
      status: newStatus,
      completedAt: null,
      progressPercent,
      completedCourseCount: completedCount,
      currentCourseId: currentCourseId ?? undefined,
      ...(recordActivity ? { lastActivityAt: new Date().toISOString() } : {})
    },
    dbClient
  );

  return {
    isComplete: false,
    completedAt: null,
    certificateId: null,
    progressPercent
  };
}

/**
 * Synchronizes course progress for a specific course across all active learning paths
 * containing this course for the student.
 * Used for course-level events (e.g. lesson completion, course enrollment).
 * If the course was completed and a path has sequential unlock, unlocks the next course.
 * Also evaluates overall learning path completion and certificate issuance.
 */
export async function syncCourseProgressInLearningPaths(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db,
  options: TProgressSyncOptions = {}
): Promise<void> {
  const enrolledPaths = await getPathsContainingCourseForMember(courseId, profileId, dbClient);
  if (enrolledPaths.length === 0) {
    return;
  }

  const stats = await getCourseCompletionStatsForProfile(courseId, profileId, dbClient);
  const totalItems = stats.totalLessons + stats.totalExercises;
  const completedItems = stats.completedLessons + stats.completedExercises;
  const progressPercent = totalItems > 0 ? Math.round((completedItems * 100) / totalItems) : 100;
  const nowIso = new Date().toISOString();

  for (const path of enrolledPaths) {
    const member = await getMemberByPathAndProfile(path.id, profileId, dbClient);
    if (!member) {
      continue;
    }

    const pathCourses = await listLearningPathCourses(path.id, dbClient);
    const sortedPathCourses = [...pathCourses].sort((a, b) => a.order - b.order);
    const currentPathCourse = pathCourses.find((pc) => pc.courseId === courseId);
    if (!currentPathCourse) {
      continue;
    }

    const existingProgress = await getSingleMemberCourseProgress(member.id, currentPathCourse.id, dbClient);

    let isUnlocked = true;
    if (path.sequentialUnlock) {
      const unlockedCourseIds = await unlockedCourses(
        { sequentialUnlock: true, courseIds: sortedPathCourses.map((pc) => pc.courseId) },
        profileId,
        dbClient
      );
      isUnlocked = unlockedCourseIds.includes(courseId);
    }

    const status = stats.isComplete
      ? 'COMPLETED'
      : progressPercent > 0
        ? 'IN_PROGRESS'
        : isUnlocked
          ? 'NOT_STARTED'
          : 'LOCKED';

    const updatePayload: Parameters<typeof upsertMemberCourseProgress>[2] = {
      status,
      progressPercent,
      lessonsCompleted: stats.completedLessons,
      lessonsTotal: stats.totalLessons,
      exercisesCompleted: stats.completedExercises,
      exercisesTotal: stats.totalExercises
    };

    if (stats.isComplete) {
      updatePayload.completedAt = existingProgress?.completedAt ?? nowIso;
    } else {
      updatePayload.completedAt = null;
    }

    if (progressPercent > 0) {
      updatePayload.startedAt = existingProgress?.startedAt ?? nowIso;
    } else {
      updatePayload.startedAt = null;
    }

    if (isUnlocked) {
      updatePayload.unlockedAt = existingProgress?.unlockedAt ?? nowIso;
    } else {
      updatePayload.unlockedAt = null;
    }

    await upsertMemberCourseProgress(member.id, currentPathCourse.id, updatePayload, dbClient);

    if (stats.isComplete && path.sequentialUnlock) {
      const currentIndex = sortedPathCourses.findIndex((pc) => pc.id === currentPathCourse.id);
      if (currentIndex !== -1 && currentIndex + 1 < sortedPathCourses.length) {
        const nextPathCourse = sortedPathCourses[currentIndex + 1];
        const nextProgress = await getSingleMemberCourseProgress(member.id, nextPathCourse.id, dbClient);

        // Only transition if the course is currently LOCKED (or never initialized yet)
        if (!nextProgress || nextProgress.status === 'LOCKED') {
          await upsertMemberCourseProgress(
            member.id,
            nextPathCourse.id,
            {
              status: 'NOT_STARTED',
              unlockedAt: nextProgress?.unlockedAt ?? nowIso
            },
            dbClient
          );
        }
      }
    }

    await evaluatePathCompletion(path.id, profileId, dbClient, options);
  }
}

/**
 * Synchronizes the member progress cache for all courses in a learning path.
 * Updates each course's cached progress and evaluates overall path completion once at the end.
 */
export async function syncPathProgressForMember(
  pathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db,
  { recordActivity = false }: TProgressSyncOptions = {}
): Promise<void> {
  const path = await getLearningPathById(pathId, dbClient);
  const member = path ? await getMemberByPathAndProfile(path.id, profileId, dbClient) : null;

  if (!path || !member) {
    return;
  }

  const pathCourses = await listLearningPathCourses(path.id, dbClient);
  const sortedPathCourses = [...pathCourses].sort((a, b) => a.order - b.order);
  const courseIds = sortedPathCourses.map((pc) => pc.courseId);

  const statsResults = await Promise.all(
    sortedPathCourses.map((pc) => getCourseCompletionStatsForProfile(pc.courseId, profileId, dbClient))
  );

  let unlockedCourseIds = courseIds;
  if (path.sequentialUnlock) {
    unlockedCourseIds = [];
    for (let i = 0; i < sortedPathCourses.length; i++) {
      const cId = sortedPathCourses[i].courseId;
      unlockedCourseIds.push(cId);
      if (!statsResults[i].isComplete) {
        break;
      }
    }
  }

  const nowIso = new Date().toISOString();

  for (let i = 0; i < sortedPathCourses.length; i++) {
    const pathCourse = sortedPathCourses[i];
    const stats = statsResults[i];
    const totalItems = stats.totalLessons + stats.totalExercises;
    const completedItems = stats.completedLessons + stats.completedExercises;
    const progressPercent = totalItems > 0 ? Math.round((completedItems * 100) / totalItems) : 100;
    const isUnlocked = unlockedCourseIds.includes(pathCourse.courseId);

    const existingProgress = await getSingleMemberCourseProgress(member.id, pathCourse.id, dbClient);

    const status = stats.isComplete
      ? 'COMPLETED'
      : progressPercent > 0
        ? 'IN_PROGRESS'
        : isUnlocked
          ? 'NOT_STARTED'
          : 'LOCKED';

    const completedAt = stats.isComplete ? (existingProgress?.completedAt ?? nowIso) : null;
    const startedAt = progressPercent > 0 ? (existingProgress?.startedAt ?? nowIso) : null;
    const unlockedAt = isUnlocked ? (existingProgress?.unlockedAt ?? nowIso) : null;

    const updatePayload: Parameters<typeof upsertMemberCourseProgress>[2] = {
      status,
      progressPercent,
      lessonsCompleted: stats.completedLessons,
      lessonsTotal: stats.totalLessons,
      exercisesCompleted: stats.completedExercises,
      exercisesTotal: stats.totalExercises,
      completedAt,
      startedAt,
      unlockedAt
    };

    await upsertMemberCourseProgress(member.id, pathCourse.id, updatePayload, dbClient);
  }

  await evaluatePathCompletion(path.id, profileId, dbClient, { recordActivity });
}

/** Members synced in parallel by a path-wide or reconcile run. */
const PROGRESS_SYNC_CONCURRENCY = 5;

/** Syncs each member's cached progress, counting (not throwing) failures. */
async function syncMembers(
  members: Array<{ pathId: string; profileId: string }>
): Promise<{ synced: number; failed: number }> {
  let failed = 0;

  await mapWithConcurrency(members, PROGRESS_SYNC_CONCURRENCY, async ({ pathId, profileId }) => {
    try {
      await syncPathProgressForMember(pathId, profileId);
    } catch (error) {
      failed += 1;
      console.error('syncPathProgressForMember failed', { pathId, profileId }, error);
    }
  });

  return { synced: members.length - failed, failed };
}

/**
 * Syncs the given students of a path, or every active student when
 * `profileIds` is omitted. One member's failure never stops the rest.
 */
export async function syncLearningPathMembersProgress({
  pathId,
  profileIds
}: TLearningPathProgressSyncPayload): Promise<{ synced: number; failed: number }> {
  const activeMembers = profileIds ? [] : await listActivePathMemberIds(pathId);
  const studentProfileIds =
    profileIds ??
    activeMembers
      .filter((member) => member.roleId === ROLE.STUDENT && member.profileId)
      .map((member) => member.profileId as string);

  return syncMembers(studentProfileIds.map((profileId) => ({ pathId, profileId })));
}

/**
 * Daily safety net: re-syncs unfinished students whose cache may have drifted
 * without an event (see `listMembersForProgressReconcile`).
 */
export async function reconcileLearningPathProgress({
  activeWithinDays,
  contentChangedWithinHours
}: TLearningPathProgressReconcilePayload): Promise<{ synced: number; failed: number }> {
  const now = Date.now();
  const activeSinceIso = new Date(now - activeWithinDays * 86_400_000).toISOString();
  const contentChangedSinceIso = new Date(now - contentChangedWithinHours * 3_600_000).toISOString();

  const members = await listMembersForProgressReconcile({ activeSinceIso, contentChangedSinceIso });

  return syncMembers(members.map((member) => ({ pathId: member.learningPathId, profileId: member.profileId })));
}
