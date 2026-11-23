import { db } from '@cio/db/drizzle';
import { getProfilesByEmails } from '@cio/db/queries/auth';
import { getOrgMembersByProfileIds } from '@cio/db/queries/organization';
import {
  deleteLearningPath,
  deleteLearningPathCourse,
  deleteLearningPathMember,
  getCourseOrganizationIds,
  getLearningPathById,
  getLearningPathMember,
  getMaxLearningPathCourseOrder,
  insertLearningPath,
  insertLearningPathCourse,
  listLearningPathCourses,
  listLearningPathMembers,
  listLearningPathSlugs,
  listLearningPathStudentProfileIds,
  listOrgCoursesForLearningPath,
  listOrgLearningPaths,
  listProfileCourseProgress,
  setLearningPathCourseOrder,
  touchLearningPath,
  updateLearningPath
} from '@cio/db/queries/learning-path/learning-path';
import type { TLearningPath } from '@cio/db/types';
import { ROLE } from '@cio/utils/constants';
import { isUniqueConstraintViolation } from '@cio/utils/errors';
import { resolveSlugCollision, slugifyTitle } from '@cio/utils/validation/shared/slug';
import type {
  TAddLearningPathMembers,
  TCreateLearningPath,
  TUpdateLearningPath
} from '@cio/utils/validation/learning-path/learning-path';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  enrollStudentsInPath,
  pathCourseGroups,
  runPathEnrollmentSideEffects,
  writePathEnrollment,
  type PathCourseGroup,
  type PathEnrollmentRequest
} from './enrollment';
import { buildLearnerPathProgress } from './progress';

export async function getOrgLearningPathOrThrow(organizationId: string, pathId: string): Promise<TLearningPath> {
  const path = await getLearningPathById(pathId);
  if (!path || path.organizationId !== organizationId) {
    throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
  }

  return path;
}

async function listPathCourseGroups(pathId: string): Promise<PathCourseGroup[]> {
  return pathCourseGroups(await listLearningPathCourses(pathId));
}

export async function listLearningPathsService(organizationId: string) {
  const paths = await listOrgLearningPaths(organizationId);
  const activePaths = paths.filter((path) => path.status === 'ACTIVE').length;
  const enrolledLearners = paths.reduce((sum, path) => sum + path.learnerCount, 0);
  const completions = paths.reduce((sum, path) => sum + path.completedCount, 0);
  const completionRate = enrolledLearners > 0 ? Math.round((completions / enrolledLearners) * 100) : 0;

  return {
    paths: paths.map((path) => ({
      ...path,
      completionRate: path.learnerCount > 0 ? Math.round((path.completedCount / path.learnerCount) * 100) : 0
    })),
    overview: { activePaths, enrolledLearners, completions, completionRate }
  };
}

export async function createLearningPathService(organizationId: string, profileId: string, data: TCreateLearningPath) {
  const takenSlugs = await listLearningPathSlugs(organizationId);
  const slug = resolveSlugCollision(slugifyTitle(data.name), takenSlugs);

  try {
    return await insertLearningPath({
      organizationId,
      name: data.name,
      description: data.description ?? null,
      slug,
      createdByProfileId: profileId
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new AppError('A learning path with this name already exists', ErrorCodes.CONFLICT, 409);
    }
    throw error;
  }
}

export async function getLearningPathDetailService(organizationId: string, pathId: string) {
  const path = await getOrgLearningPathOrThrow(organizationId, pathId);
  const courses = await listLearningPathCourses(pathId);
  const studentIds = await listLearningPathStudentProfileIds(pathId);

  return {
    ...path,
    learnerCount: studentIds.length,
    courses: courses.map((course) => ({
      courseId: course.courseId,
      order: course.order,
      title: course.title,
      description: course.description,
      logo: course.logo,
      bannerImage: course.bannerImage,
      isPublished: course.isPublished,
      cost: course.cost,
      currency: course.currency,
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount
    }))
  };
}

export async function updateLearningPathService(organizationId: string, pathId: string, data: TUpdateLearningPath) {
  await getOrgLearningPathOrThrow(organizationId, pathId);

  if (data.status === 'ACTIVE') {
    const courses = await listLearningPathCourses(pathId);
    if (!courses.some((course) => course.isPublished)) {
      throw new AppError(
        'Add a published course before making the learning path active',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }

  const updated = await updateLearningPath(pathId, data);
  if (!updated) {
    throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
  }

  return updated;
}

/** Deletes the path. Course enrollments and progress stay. */
export async function deleteLearningPathService(organizationId: string, pathId: string) {
  await getOrgLearningPathOrThrow(organizationId, pathId);
  await deleteLearningPath(pathId);

  return { id: pathId };
}

export async function listLearningPathCourseOptionsService(organizationId: string, pathId: string) {
  await getOrgLearningPathOrThrow(organizationId, pathId);

  return listOrgCoursesForLearningPath(organizationId, pathId);
}

/** Adds a course at the end of the path and, when the path auto-enrolls, enrolls its current students. */
export async function addLearningPathCourseService(
  organizationId: string,
  pathId: string,
  courseId: string,
  actorProfileId: string
) {
  const path = await getOrgLearningPathOrThrow(organizationId, pathId);
  const [courseOrg] = await getCourseOrganizationIds([courseId]);
  if (!courseOrg || courseOrg.organizationId !== organizationId || courseOrg.status !== 'ACTIVE') {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const studentIds = path.autoEnroll ? await listLearningPathStudentProfileIds(pathId) : [];
  const enrollment: PathEnrollmentRequest = {
    organizationId,
    pathId: null,
    profileIds: studentIds,
    courseGroups: courseOrg.groupId ? [{ courseId, groupId: courseOrg.groupId }] : [],
    method: 'admin',
    source: 'dashboard',
    actorProfileId
  };

  const write = await db.transaction(async (tx) => {
    await touchLearningPath(pathId, tx);
    const order = (await getMaxLearningPathCourseOrder(pathId, tx)) + 1;
    const added = await insertLearningPathCourse({ pathId, courseId, order }, tx);
    if (!added) {
      throw new AppError(
        'This course is already in the learning path',
        ErrorCodes.LEARNING_PATH_COURSE_ALREADY_ADDED,
        409
      );
    }

    return writePathEnrollment(enrollment, tx);
  });

  await runPathEnrollmentSideEffects(enrollment, write);

  return { courseId, enrolledStudents: write.courseMembers.length };
}

/** Removes a course from the path. Nobody is unenrolled from the course. */
export async function removeLearningPathCourseService(organizationId: string, pathId: string, courseId: string) {
  await getOrgLearningPathOrThrow(organizationId, pathId);

  await db.transaction(async (tx) => {
    const removed = await deleteLearningPathCourse(pathId, courseId, tx);
    if (!removed) {
      throw new AppError('Course is not in this learning path', ErrorCodes.LEARNING_PATH_COURSE_NOT_FOUND, 404);
    }

    const remaining = await listLearningPathCourses(pathId, tx);
    if (remaining.length > 0) {
      await setLearningPathCourseOrder(
        pathId,
        remaining.map((course) => course.courseId),
        tx
      );
    }
    await touchLearningPath(pathId, tx);
  });

  return { courseId };
}

export async function reorderLearningPathCoursesService(organizationId: string, pathId: string, courseIds: string[]) {
  await getOrgLearningPathOrThrow(organizationId, pathId);

  await db.transaction(async (tx) => {
    const current = await listLearningPathCourses(pathId, tx);
    const currentIds = new Set(current.map((course) => course.courseId));
    const sameSet = courseIds.length === currentIds.size && courseIds.every((id) => currentIds.has(id));
    if (!sameSet) {
      throw new AppError(
        'The order must list every course in the learning path once',
        ErrorCodes.LEARNING_PATH_ORDER_MISMATCH,
        400
      );
    }

    await setLearningPathCourseOrder(pathId, courseIds, tx);
    await touchLearningPath(pathId, tx);
  });

  return { courseIds };
}

export async function listLearningPathMembersService(organizationId: string, pathId: string) {
  const path = await getOrgLearningPathOrThrow(organizationId, pathId);
  const [members, courses] = await Promise.all([listLearningPathMembers(pathId), listLearningPathCourses(pathId)]);
  const progressRows = await listProfileCourseProgress(
    members.map((member) => member.profileId),
    courses.map((course) => course.courseId)
  );

  const rowsByProfileId = new Map<string, typeof progressRows>();
  for (const row of progressRows) {
    rowsByProfileId.set(row.profileId, [...(rowsByProfileId.get(row.profileId) ?? []), row]);
  }

  return members.map((member) => {
    const progress = buildLearnerPathProgress(
      courses,
      rowsByProfileId.get(member.profileId) ?? [],
      path.sequentialUnlock
    );

    return {
      id: member.id,
      profileId: member.profileId,
      fullname: member.fullname,
      email: member.email,
      avatarUrl: member.avatarUrl,
      enrolledAt: member.enrolledAt,
      completedAt: member.completedAt,
      progressPercent: progress.progressPercent,
      completedCourseCount: progress.completedCourseCount,
      courseCount: progress.courses.length,
      currentCourse: progress.nextCourse
    };
  });
}

type SkippedMember = { email: string; reason: 'not_found' | 'staff' | 'already_member' };

/** Adds existing accounts by email as students of the path and of its courses. */
export async function addLearningPathMembersService(
  organizationId: string,
  pathId: string,
  data: TAddLearningPathMembers,
  actorProfileId: string
) {
  const path = await getOrgLearningPathOrThrow(organizationId, pathId);
  const skipped: SkippedMember[] = [];
  const candidates: { email: string; profileId: string }[] = [];

  const profiles = await getProfilesByEmails(data.emails);
  const profileIdByEmail = new Map(profiles.map((profile) => [profile.email, profile.id]));

  for (const email of data.emails) {
    const profileId = profileIdByEmail.get(email);
    if (!profileId) skipped.push({ email, reason: 'not_found' });
    else candidates.push({ email, profileId });
  }

  const orgMembers = await getOrgMembersByProfileIds(
    organizationId,
    candidates.map((candidate) => candidate.profileId)
  );
  const staffIds = new Set(
    orgMembers
      .filter((member) => member.roleId === ROLE.ADMIN || member.roleId === ROLE.TUTOR)
      .map((member) => member.profileId)
  );
  const existingIds = new Set(await listLearningPathStudentProfileIds(pathId));
  const toEnroll: { email: string; profileId: string }[] = [];

  for (const candidate of candidates) {
    if (staffIds.has(candidate.profileId)) skipped.push({ email: candidate.email, reason: 'staff' });
    else if (existingIds.has(candidate.profileId)) skipped.push({ email: candidate.email, reason: 'already_member' });
    else toEnroll.push(candidate);
  }

  const courseGroups = path.autoEnroll ? await listPathCourseGroups(pathId) : [];
  await enrollStudentsInPath({
    organizationId,
    pathId,
    profileIds: toEnroll.map((candidate) => candidate.profileId),
    courseGroups,
    method: 'admin',
    source: 'dashboard',
    actorProfileId
  });

  return { added: toEnroll.map((candidate) => candidate.email), skipped };
}

/** Removes a member from the path. Their course enrollments and progress stay. */
export async function removeLearningPathMemberService(organizationId: string, pathId: string, memberId: string) {
  await getOrgLearningPathOrThrow(organizationId, pathId);

  const member = await getLearningPathMember(pathId, memberId);
  if (!member) {
    throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
  }

  await deleteLearningPathMember(pathId, memberId);

  return { id: memberId };
}
