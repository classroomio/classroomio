import { AppError, ErrorCodes, throwAsInternal } from '@api/utils/errors';
import { orgHasCertificatesEnabled } from '@api/utils/plan-features';
import { getMemberByPathAndProfile, getPathJourney } from '@cio/db/queries/learning-path';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

type TPathJourneyStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface TJourneyCourseLike {
  courseId: string;
  title?: string | null;
  isComplete: boolean;
}

export interface TJourneySummary {
  totalCourses: number;
  completedCourses: number;
  isComplete: boolean;
  progressPercent: number;
  status: TPathJourneyStatus;
  currentCourseId: string | null;
  currentCourseTitle: string | null;
}

/**
 * Pure path-progress summary shared by the learner hub and the AI tutor's
 * learning-path tool, so progressPercent, currentCourseId (first incomplete,
 * falling back to the last course) and status always agree.
 */
export function summarizeJourney(courses: TJourneyCourseLike[]): TJourneySummary {
  const totalCourses = courses.length;
  const completedCourses = courses.filter((course) => course.isComplete).length;
  const isComplete = totalCourses > 0 && completedCourses === totalCourses;
  const progressPercent = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const currentCourse = courses.find((course) => !course.isComplete) ?? courses.at(-1) ?? null;

  let status: TPathJourneyStatus = 'NOT_STARTED';
  if (isComplete) {
    status = 'COMPLETED';
  } else if (completedCourses > 0) {
    status = 'IN_PROGRESS';
  }

  return {
    totalCourses,
    completedCourses,
    isComplete,
    progressPercent,
    status,
    currentCourseId: currentCourse?.courseId ?? null,
    currentCourseTitle: currentCourse?.title ?? null
  };
}

/**
 * A learner's path hub and in-course stepper: the path, every course in order
 * with live progress and lock state, the course to continue, and the
 * certificate when it can be downloaded. Progress is read live, like the
 * enrolled feed, so the hub and My Learning always agree; nothing is written.
 *
 * `member` is the membership the route middleware resolved. Org admins pass
 * through that middleware without one, so an admin who is also enrolled is
 * looked up here.
 */
export async function getPathJourneyService(
  path: TLearningPath,
  member: TLearningPathMember | null,
  profileId: string
) {
  try {
    const activeMember = member ?? (await getMemberByPathAndProfile(path.id, profileId));

    if (!activeMember) {
      throw new AppError('You are not enrolled in this learning path', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
    }

    const journey = await getPathJourney({
      pathId: path.id,
      memberId: activeMember.id,
      profileId,
      sequentialUnlock: path.sequentialUnlock
    });

    // Same rules as evaluatePathCompletion: an empty path is never complete,
    // and the current course is the first incomplete one, else the last.
    const {
      totalCourses,
      completedCourses,
      isComplete,
      progressPercent: progress,
      status,
      currentCourseId
    } = summarizeJourney(journey.courses);

    const certificate = await resolveDownloadableCertificate(path, activeMember, journey.certificate);

    return {
      path: {
        id: path.id,
        publicId: path.publicId,
        name: path.name,
        slug: path.slug,
        description: path.description,
        coverImage: path.coverImage,
        sequentialUnlock: path.sequentialUnlock
      },
      status,
      isComplete,
      progress,
      completedCourses,
      totalCourses,
      currentCourseId,
      enrolledAt: activeMember.enrolledAt,
      completedAt: isComplete ? activeMember.completedAt : null,
      lastProgressAt: journey.lastProgressAt,
      courses: journey.courses,
      certificate
    };
  } catch (error) {
    throwAsInternal(error, 'Failed to get learning path journey');
  }
}

/**
 * The issued certificate, only when assertLearningPathCertificateDownloadAllowed
 * would let this member download it, so the hub never offers one that fails.
 */
async function resolveDownloadableCertificate(
  path: TLearningPath,
  member: TLearningPathMember,
  issued: { certificateId: string; issuedAt: string } | null
) {
  if (!issued || member.status !== 'COMPLETED' || !path.certificate?.isDownloadable) {
    return null;
  }

  const certificatesEnabled = await orgHasCertificatesEnabled(path.organizationId);

  return certificatesEnabled ? issued : null;
}
