import { getOrgMembersByProfileIds } from '@cio/db/queries/organization';
import {
  getLearningPathMemberByProfile,
  listEnrolledLearningPaths,
  listExplorableLearningPaths,
  listLearningPathCourses,
  listProfileCourseProgress,
  type TLearningPathCourseRow
} from '@cio/db/queries/learning-path/learning-path';
import type { TLearningPath } from '@cio/db/types';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { arePathCoursesSelfEnrollable, enrollStudentsInPath, pathCourseGroups } from './enrollment';
import { getOrgLearningPathOrThrow } from './learning-path';
import { buildLearnerPathProgress, collectPathLocks, type PathLock } from './progress';

function pathSummary(path: TLearningPath) {
  return {
    id: path.id,
    name: path.name,
    slug: path.slug,
    description: path.description,
    coverImage: path.coverImage,
    sequentialUnlock: path.sequentialUnlock
  };
}

function enrollability(
  path: Pick<TLearningPath, 'cost' | 'currency' | 'status' | 'selfEnrollment'>,
  courses: TLearningPathCourseRow[]
) {
  const requiresPayment = path.cost > 0;
  const canEnrollInApp =
    path.status === 'ACTIVE' && path.selfEnrollment && !requiresPayment && arePathCoursesSelfEnrollable(courses);

  return { cost: path.cost, currency: path.currency, requiresPayment, canEnrollInApp };
}

async function loadCoursesByPath(pathIds: string[]) {
  const entries = await Promise.all(
    pathIds.map(async (pathId) => [pathId, await listLearningPathCourses(pathId)] as const)
  );

  return new Map<string, TLearningPathCourseRow[]>(entries);
}

/** The caller's ACTIVE paths in the organization, each with per-course progress and unlock state. */
export async function listEnrolledLearningPathsService(organizationId: string, profileId: string) {
  const rows = await listEnrolledLearningPaths(organizationId, profileId);
  const coursesByPath = await loadCoursesByPath(rows.map((row) => row.path.id));
  const allCourseIds = [...new Set([...coursesByPath.values()].flat().map((course) => course.courseId))];
  const progressRows = await listProfileCourseProgress([profileId], allCourseIds);

  return rows.map((row) => {
    const courses = coursesByPath.get(row.path.id) ?? [];
    const progress = buildLearnerPathProgress(courses, progressRows, row.path.sequentialUnlock);

    return {
      ...pathSummary(row.path),
      enrolledAt: row.enrolledAt,
      completedAt: row.completedAt,
      courseCount: progress.courses.length,
      completedCourseCount: progress.completedCourseCount,
      progressPercent: progress.progressPercent,
      nextCourse: progress.nextCourse,
      courses: progress.courses
    };
  });
}

/**
 * Locks that the caller's sequential paths put on courses, keyed by course id. Used to mark enrolled
 * courses as locked in course lists.
 */
export async function getPathLocksForProfile(
  organizationId: string,
  profileId: string
): Promise<Map<string, PathLock>> {
  const rows = (await listEnrolledLearningPaths(organizationId, profileId)).filter(
    (row) => row.path.sequentialUnlock && row.enrolledAt
  );
  const locks = new Map<string, PathLock>();
  if (rows.length === 0) return locks;

  const coursesByPath = await loadCoursesByPath(rows.map((row) => row.path.id));
  const allCourseIds = [...new Set([...coursesByPath.values()].flat().map((course) => course.courseId))];
  const progressRows = await listProfileCourseProgress([profileId], allCourseIds);

  for (const row of rows) {
    const courses = coursesByPath.get(row.path.id) ?? [];
    const progress = buildLearnerPathProgress(courses, progressRows, true);
    collectPathLocks(
      { pathId: row.path.id, pathName: row.path.name, sequentialUnlock: true, enrolledAt: row.enrolledAt! },
      progress,
      progressRows,
      courses,
      locks
    );
  }

  return locks;
}

/** ACTIVE self-enrollable paths the caller has not joined. */
export async function listExploreLearningPathsService(organizationId: string, profileId: string) {
  const rows = await listExplorableLearningPaths(organizationId, profileId);
  const coursesByPath = await loadCoursesByPath(rows.map((row) => row.id));

  return rows.map((row) => {
    const pathCourses = coursesByPath.get(row.id) ?? [];
    const courses = pathCourses.filter((course) => course.isPublished);
    const access = enrollability({ ...row, status: 'ACTIVE', selfEnrollment: true }, pathCourses);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      coverImage: row.coverImage,
      sequentialUnlock: row.sequentialUnlock,
      courseCount: courses.length,
      lessonCount: courses.reduce((sum, course) => sum + course.lessonCount, 0),
      exerciseCount: courses.reduce((sum, course) => sum + course.exerciseCount, 0),
      ...access
    };
  });
}

/**
 * One path as the caller sees it: members get their progress, non-members may view an ACTIVE
 * self-enrollable path before joining it.
 */
export async function getLearnerLearningPathService(organizationId: string, pathId: string, profileId: string) {
  const path = await getOrgLearningPathOrThrow(organizationId, pathId);
  const member = await getLearningPathMemberByProfile(pathId, profileId);
  const visible = path.status === 'ACTIVE' && (member !== null || path.selfEnrollment);
  if (!visible) {
    throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
  }

  const courses = await listLearningPathCourses(pathId);
  const progressRows = member
    ? await listProfileCourseProgress(
        [profileId],
        courses.map((course) => course.courseId)
      )
    : [];
  const progress = buildLearnerPathProgress(courses, progressRows, path.sequentialUnlock);
  const access = enrollability(path, courses);

  return {
    ...pathSummary(path),
    isMember: member !== null,
    enrolledAt: member?.enrolledAt ?? null,
    completedAt: member?.completedAt ?? null,
    ...access,
    canEnrollInApp: member === null && access.canEnrollInApp,
    courseCount: progress.courses.length,
    completedCourseCount: progress.completedCourseCount,
    progressPercent: progress.progressPercent,
    nextCourse: progress.nextCourse,
    courses: progress.courses
  };
}

/** Self-enrolls the caller in a free ACTIVE path and every course in it. Repeating the call changes nothing. */
export async function enrollInLearningPathService(organizationId: string, pathId: string, profileId: string) {
  const path = await getOrgLearningPathOrThrow(organizationId, pathId);
  const existing = await getLearningPathMemberByProfile(pathId, profileId);

  if (!existing) {
    const courses = await listLearningPathCourses(pathId);
    if (!enrollability(path, courses).canEnrollInApp) {
      throw new AppError('This learning path is not open for enrollment', ErrorCodes.LEARNING_PATH_NOT_ENROLLABLE, 403);
    }

    const [orgMember] = await getOrgMembersByProfileIds(organizationId, [profileId]);
    if (orgMember && orgMember.roleId !== ROLE.STUDENT) {
      throw new AppError('Only students can join a learning path', ErrorCodes.LEARNING_PATH_NOT_ENROLLABLE, 403);
    }

    const courseGroups = path.autoEnroll ? pathCourseGroups(courses) : [];

    await enrollStudentsInPath({
      organizationId,
      pathId,
      profileIds: [profileId],
      courseGroups,
      method: 'self_enroll',
      source: 'dashboard',
      actorProfileId: profileId
    });
  }

  return getLearnerLearningPathService(organizationId, pathId, profileId);
}
