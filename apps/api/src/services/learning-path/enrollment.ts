import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import {
  getCourseCompletionStatsForProfile,
  getCourseIdsInPath,
  getEnrolledPaths,
  getLearningPathCertificate,
  getMemberByPathAndProfile,
  getMemberCourseProgress,
  listLearningPathCourses,
  type TLearningPathCourseDetail
} from '@cio/db/queries/learning-path';
import { getOrganizationById, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

import { resolveLearningPath } from './learning-path';
import { enrollProfileInLearningPath } from './member-management';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { syncPathProgressForMember } from './unlock';
import { sendLearningPathWelcomeEmail } from './email';
import { trackServerEvent, SERVER_EVENTS } from '@cio/analytics';

export interface TEnrolledCourseProgress extends TLearningPathCourseDetail {
  isUnlocked: boolean;
  isComplete: boolean;
}

export interface TEnrolledLearningPathWithProgress extends Omit<TLearningPath, 'certificate'> {
  member: {
    id: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    enrolledAt: string;
    completedAt: string | null;
    progressPercent: number;
    completedCourseCount: number;
    currentCourseId: string | null;
  };
  certificate: {
    certificateId: string;
    issuedAt: string;
    fileUrl: string | null;
  } | null;
  courses: TEnrolledCourseProgress[];
}

/**
 * Enrolls a student into a learning path and auto-enrolls them into all courses in the path.
 * Wraps member creation, course group membership, and enrollment grant records in a single transaction.
 * Idempotent on repeated calls.
 */
export async function enrollInLearningPath(pathId: string, profileId: string): Promise<TLearningPathMember> {
  const { member, path, organization, isFreshJoin, email } = await db.transaction(async (transactionClient) => {
    const path = await resolveLearningPath(pathId, transactionClient);

    if (!path.isPublished) {
      throw new AppError('Learning path is not published', ErrorCodes.PATH_NOT_PUBLISHED, 400);
    }

    if (!path.selfEnrollment) {
      throw new AppError('Self-enrollment is disabled for this learning path', ErrorCodes.FORBIDDEN, 403);
    }

    if (path.cost > 0) {
      throw new AppError('Paid learning paths require an invite or payment', ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Enforce organization-level enrollment safeguards
    const organization = await getOrganizationById(path.organizationId, transactionClient);
    if (!organization) {
      throw new AppError('Organization not found', ErrorCodes.INTERNAL_ERROR, 500);
    }

    const isInternalOnly = organization.settings?.internalEnrollmentOnly ?? false;
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, profileId, transactionClient);

    if (isInternalOnly && !orgMemberId) {
      throw new AppError(
        'This organization only allows its members to enroll. Ask an admin for an invitation.',
        ErrorCodes.FORBIDDEN,
        403
      );
    }

    const existingMember = await getMemberByPathAndProfile(path.id, profileId, transactionClient);
    const isFreshJoin = !existingMember;

    const member = await enrollProfileInLearningPath(path, { profileId, roleId: ROLE.STUDENT }, transactionClient);

    const studentProfile = await getProfileById(profileId);
    const studentEmail = studentProfile?.email ?? null;

    return { member, path, organization, isFreshJoin, email: studentEmail };
  });

  // Compliance courses track enrollment records for due dates and renewals.
  // Mirrors course self-enroll: runs post-commit, and the helper skips
  // non-compliance courses, missing memberships, and existing records itself.
  if (isFreshJoin) {
    const pathCourseIds = await getCourseIdsInPath(path.id);
    await ensureComplianceEnrollmentRecordsForProfiles(pathCourseIds, [profileId]);
  }

  if (isFreshJoin && email) {
    await sendLearningPathWelcomeEmail({
      organization,
      learningPath: path,
      profileId,
      email,
      idempotencyKey: `self-enroll-learning-path-welcome:${path.id}:${profileId}`
    });
  }

  if (isFreshJoin) {
    trackServerEvent({
      eventType: SERVER_EVENTS.ENROLLMENT_COMPLETED,
      orgId: path.organizationId,
      userId: profileId,
      props: { path: 'learning-path', learningPathId: path.id, source: 'self-enroll' }
    });
  }

  return member;
}

/**
 * Derives unlocked course IDs from pre-computed completion stats,
 * avoiding redundant DB queries that `unlockedCourses` would make.
 */
function unlockedCoursesFromStats(
  sequentialUnlock: boolean,
  courseIds: string[],
  completionByCourseId: Map<string, boolean>
): string[] {
  if (!sequentialUnlock) {
    return courseIds;
  }

  const unlocked: string[] = [];
  for (const courseId of courseIds) {
    unlocked.push(courseId);
    if (!completionByCourseId.get(courseId)) {
      break;
    }
  }

  return unlocked;
}

/**
 * Returns learning paths that the student is actively enrolled in,
 * including live progress calculations and per-course unlock status.
 *
 * Path course lists are pre-fetched in parallel and each enrolled path is
 * then processed concurrently, so latency stays flat as enrollments grow
 * instead of scaling with one serial round-trip per path.
 */
export async function getEnrolledLearningPaths(
  profileId: string,
  organizationId?: string
): Promise<TEnrolledLearningPathWithProgress[]> {
  try {
    const enrolledRows = await getEnrolledPaths(profileId, organizationId);

    if (enrolledRows.length === 0) {
      return [];
    }

    const syncedPathIds = new Set<string>();

    // Pre-fetch every path's course list concurrently.
    const pathCourseMap = new Map<string, TLearningPathCourseDetail[]>();
    await Promise.all(
      enrolledRows.map(async ({ learningPath }) => {
        const courses = await listLearningPathCourses(learningPath.id);
        pathCourseMap.set(learningPath.id, courses);
      })
    );

    const results = await Promise.all(
      enrolledRows.map(async ({ member, learningPath }) => {
        const courses = pathCourseMap.get(learningPath.id) ?? [];
        const courseIds = courses.map((course) => course.courseId);

        // Fetch completion stats once per course in parallel
        const statsResults = await Promise.all(
          courses.map((course) => getCourseCompletionStatsForProfile(course.courseId, profileId))
        );
        const completionByCourseId = new Map(courses.map((course, i) => [course.courseId, statsResults[i].isComplete]));

        // Derive unlock status from pre-computed completion
        const unlocked = unlockedCoursesFromStats(learningPath.sequentialUnlock, courseIds, completionByCourseId);

        const cachedProgressRows = await getMemberCourseProgress(member.id);
        const progressByPathCourseId = new Map(cachedProgressRows.map((r) => [r.learningPathCourseId, r]));

        const coursesWithProgress: TEnrolledCourseProgress[] = [];
        let completedCount = 0;
        let hasDrift = false;

        for (const course of courses) {
          const isComplete = completionByCourseId.get(course.courseId) ?? false;
          if (isComplete) {
            completedCount++;
          }

          const isUnlocked = unlocked.includes(course.courseId);
          coursesWithProgress.push({
            ...course,
            isUnlocked,
            isComplete
          });

          // Detect cache drift
          const cached = progressByPathCourseId.get(course.id);
          const expectedStatus = isComplete ? 'COMPLETED' : !isUnlocked ? 'LOCKED' : undefined;
          const hasStatusDrift =
            (expectedStatus && cached?.status !== expectedStatus) || (cached?.status === 'LOCKED' && isUnlocked);
          if (!cached || hasStatusDrift) {
            hasDrift = true;
          }
        }

        // Self-heal the path's cached progress once in the background
        if (hasDrift && !syncedPathIds.has(learningPath.id)) {
          syncedPathIds.add(learningPath.id);
          void syncPathProgressForMember(learningPath.id, profileId).catch((syncErr) => {
            console.error('Self-healing learning path progress cache failed:', syncErr);
          });
        }

        const totalCourses = courses.length;
        const progressPercent = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

        const certificateRow = await getLearningPathCertificate(member.id);
        const certificateData = certificateRow
          ? {
              certificateId: certificateRow.certificateId,
              issuedAt: certificateRow.issuedAt,
              fileUrl: certificateRow.fileUrl
            }
          : null;

        const memberProgressData = {
          id: member.id,
          status: member.status,
          enrolledAt: member.enrolledAt,
          completedAt: member.completedAt,
          progressPercent,
          completedCourseCount: completedCount,
          currentCourseId: member.currentCourseId
        };

        return {
          ...learningPath,
          member: memberProgressData,
          certificate: certificateData,
          courses: coursesWithProgress
        };
      })
    );

    return results;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get enrolled learning paths',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
