import { AppError, ErrorCodes } from '@cio/utils/errors';
import { sanitizeHtml, sanitizeOptionalHtml, sanitizeUnknownStrings } from '../../utils/sanitize-html';
import {
  createCourseNewsfeed,
  createCourse as createCourseQuery,
  createCourseSections,
  deleteCourse as deleteCourseQuery,
  getCourseById,
  getCourseContentItems,
  getCourseProgress as getCourseProgressQuery,
  getCourseWithRelations,
  getOrgIdByCourseId,
  updateCourse as updateCourseQuery,
  updateLessonsSectionId
} from '@cio/db/queries/course';
import {
  addGroupMember,
  createGroup,
  getCourseProgramAccess,
  insertGroupMembersOnConflictDoNothing
} from '@cio/db/queries/group';
import {
  getLastLogin,
  getLastSeenForUserIds,
  getLessonsWithCompletion,
  getProfileCourseProgress,
  getUserExercisesStats
} from '@cio/db/queries/analytics/analytics';
import { getStudentCourseProgressImpactCounts } from '@cio/db/queries/course/reset-progress';
import { getCourseGroupId } from '@cio/db/queries/course/people';

import { ContentType, ROLE } from '@cio/utils/constants';
import { isPublishedComplianceMissingDeadline, resolveCourseCertificateDeadline } from '@cio/utils/functions';
import type { TCourse } from '@cio/db/types';
import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TCourseCreate } from '@cio/utils/validation/course';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { and, eq } from 'drizzle-orm';
import { exerciseBelongsToCourse } from '@cio/db/queries/course/certification-exercise';
import { updateExercise, updateExercisesSectionId } from '@cio/db/queries/exercise/exercise';
import { getProfileById } from '@cio/db/queries/auth';
import {
  countActiveStudents,
  getActiveOrganizationPlan,
  getOrganizationMemberIdByOrgAndProfile,
  insertOrganizationMembersOnConflictDoNothing
} from '@cio/db/queries/organization';
import { getStudentLimit } from '@cio/utils/plans';
import { env } from '../../config/env';
import { invalidateOrgStats } from '../../utils/redis/org-stats-cache';
import { annotateCourseContentWithProgression } from './progression';
import { buildCourseContent, calcPercentageWithRounding, type CourseContent } from './utils';
import { guardCourseTypeTransition } from './public-course-guard';

/**
 * Whether a *new* student would be turned away from this org right now
 * (mirrors the check in `apps/api/src/services/organization/student-limit.ts`,
 * duplicated here since packages/core can't depend on the api app).
 */
async function isStudentLimitReached(orgId: string): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return false;

  const activePlan = await getActiveOrganizationPlan(orgId);
  const limit = getStudentLimit(activePlan?.planName);
  if (!Number.isFinite(limit)) return false;

  const currentCount = await countActiveStudents(orgId);
  return currentCount + 1 > limit;
}

const DEFAULT_CONTENT_GROUPING = true;
const DEFAULT_SECTION_TITLE = 'First Section [edit me]';

export async function ensureProgramCourseAccess(courseId: string, profileId: string) {
  const access = await getCourseProgramAccess(courseId, profileId);
  if (!access) {
    return false;
  }

  const organizationId = access.organizationId;
  if (!organizationId) {
    return false;
  }

  const normalizedEmail = access.profileEmail?.trim() || undefined;

  if (access.roleId === ROLE.STUDENT) {
    const existingMemberId = await getOrganizationMemberIdByOrgAndProfile(organizationId, profileId);
    if (!existingMemberId && (await isStudentLimitReached(organizationId))) {
      throw new AppError(
        'This organization has reached its student limit on the Free plan',
        ErrorCodes.UPGRADE_REQUIRED,
        403
      );
    }
  }

  await db.transaction(async (tx) => {
    await insertOrganizationMembersOnConflictDoNothing(
      [
        {
          organizationId,
          roleId: access.roleId,
          profileId,
          email: normalizedEmail,
          verified: true
        }
      ],
      tx
    );

    await insertGroupMembersOnConflictDoNothing(
      [
        {
          groupId: access.courseGroupId,
          roleId: access.roleId,
          profileId,
          email: normalizedEmail ?? undefined
        }
      ],
      tx
    );
  });

  if (access.roleId === ROLE.STUDENT) {
    await invalidateOrgStats(organizationId);
  }

  return true;
}

function omitUndefinedValues<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

function sanitizeCourseMetadata(metadata: TCourse['metadata'] | undefined) {
  if (!metadata) return metadata;

  return {
    ...metadata,
    description: sanitizeOptionalHtml(metadata.description),
    goals: sanitizeOptionalHtml(metadata.goals),
    requirements: sanitizeOptionalHtml(metadata.requirements),
    reward: metadata.reward
      ? {
          ...metadata.reward,
          description: sanitizeOptionalHtml(metadata.reward.description)
        }
      : metadata.reward,
    instructor: metadata.instructor
      ? {
          ...metadata.instructor,
          description: sanitizeHtml(metadata.instructor.description)
        }
      : metadata.instructor,
    reviews: metadata.reviews?.map((review) => ({
      ...review,
      description: sanitizeHtml(review.description)
    }))
  };
}

function sanitizeCourseCertificate(certificate: TCourse['certificate'] | undefined) {
  if (!certificate) return certificate;

  return {
    ...certificate,
    emailMessage: sanitizeOptionalHtml(certificate.emailMessage)
  };
}

/**
 * Gets a course by ID or slug with all related data
 * @param courseId Course ID (optional if slug provided)
 * @param slug Course slug (optional if courseId provided)
 * @param profileId Profile ID of the current user (optional, for computing lesson completion)
 * @returns Course with all related data
 */
export async function getCourse(courseId?: string, slug?: string, profileId?: string) {
  try {
    if (!courseId && !slug) {
      throw new AppError('Either courseId or slug must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const course = await getCourseWithRelations(courseId, slug, profileId);
    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    const isContentGroupingEnabled = course.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;
    const progressionMode = course.metadata?.progressionMode ?? 'free';
    const roleId = profileId
      ? (course.group?.members?.find((member) => member.profileId === profileId)?.roleId ?? null)
      : null;

    const content = profileId
      ? await annotateCourseContentWithProgression({
          courseId: course.id,
          profileId,
          roleId,
          progressionMode,
          contentRows: course.contentItems,
          isContentGroupingEnabled
        })
      : buildCourseContent(course.contentItems, isContentGroupingEnabled);

    const { contentItems, org: courseOrg, ...rest } = course;

    const studentLimitReached = courseOrg ? await isStudentLimitReached(courseOrg.id) : false;

    const base = {
      ...rest,
      content,
      studentLimitReached,
      metadata: {
        ...course.metadata,
        progressionMode
      }
    };

    if (courseOrg) {
      return {
        ...base,
        org: {
          id: courseOrg.id,
          name: courseOrg.name,
          siteName: courseOrg.siteName ?? '',
          theme: courseOrg.theme ?? undefined
        }
      };
    }

    return base;
  } catch (error) {
    console.error('Error getting course:', error);
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course',
      ErrorCodes.COURSE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Creates a new course with group, group member, and default newsfeed
 * @param profileId Profile ID of the creator
 * @param data Course creation data
 * @returns Created course with group and member information
 */
export async function createCourse(
  profileId: string,
  data: TCourseCreate
): Promise<{ course: TCourse; groupId: string; memberId: string }> {
  try {
    const description = sanitizeHtml(data.description);

    const result = await db.transaction(async (tx) => {
      const [newGroup] = await createGroup(
        {
          name: data.title,
          description,
          organizationId: data.organizationId
        },
        tx
      );

      if (!newGroup) {
        throw new AppError('Failed to create group', ErrorCodes.INTERNAL_ERROR, 500);
      }

      const [newCourse] = await createCourseQuery(
        {
          title: data.title,
          description,
          type: data.type,
          groupId: newGroup.id,
          compliance: data.compliance ? sanitizeUnknownStrings(data.compliance) : undefined
        },
        tx
      );

      if (!newCourse) {
        throw new AppError('Failed to create course', ErrorCodes.INTERNAL_ERROR, 500);
      }

      const [newMember] = await addGroupMember(
        {
          profileId,
          groupId: newGroup.id,
          roleId: ROLE.TUTOR
        },
        tx
      );

      if (!newMember) {
        throw new AppError('Failed to add group member', ErrorCodes.INTERNAL_ERROR, 500);
      }

      await createCourseNewsfeed(
        {
          content: sanitizeHtml(`<h2>Welcome to this course 🎉&nbsp;</h2>
<p>Thank you for joining this course and I hope you get the best out of it.</p>`),
          courseId: newCourse.id,
          isPinned: true,
          authorId: newMember.id
        },
        tx
      );

      return {
        course: newCourse,
        groupId: newGroup.id,
        memberId: newMember.id
      };
    });

    await invalidateOrgStats(data.organizationId);

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create course',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a course
 * @param courseId Course ID
 * @param data Course update data
 * @returns Updated course
 */
export async function updateCourse(courseId: string, data: Partial<TCourse>, dbClient: DbOrTxClient = db) {
  try {
    const [existingCourse] = await getCourseById(courseId, dbClient);

    const effectiveCost = data.cost !== undefined ? data.cost : (existingCourse?.cost ?? 0);
    const effectivePaymentLink =
      data.metadata?.paymentLink !== undefined ? data.metadata.paymentLink : existingCourse?.metadata?.paymentLink;

    if (Number(effectiveCost) > 0 && !effectivePaymentLink?.trim()) {
      throw new AppError('Paid courses require a payment link', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const existingMetadata = existingCourse?.metadata;
    const mergedMetadata = data.metadata ? { ...existingMetadata, ...omitUndefinedValues(data.metadata) } : undefined;

    const sanitizedData: Partial<TCourse> = {
      ...data,
      description: sanitizeOptionalHtml(data.description),
      overview: sanitizeOptionalHtml(data.overview),
      metadata: sanitizeCourseMetadata(mergedMetadata),
      certificate: sanitizeCourseCertificate(data.certificate),
      logo: data.logo,
      slug: data.slug
    };

    const [currentCourse] = await getCourseById(courseId, dbClient);
    if (!currentCourse) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    if (data.type !== undefined) {
      await guardCourseTypeTransition({
        courseId,
        currentType: currentCourse.type ?? null,
        nextType: data.type,
        dbClient
      });
    }

    const nextType = data.type ?? currentCourse.type;
    const nextIsPublished = data.isPublished ?? currentCourse.isPublished;
    const nextDeadline = resolveCourseCertificateDeadline(currentCourse.certificate?.deadline, data.certificate);

    if (
      isPublishedComplianceMissingDeadline({
        type: nextType,
        isPublished: nextIsPublished,
        deadline: nextDeadline
      })
    ) {
      throw new AppError(
        'Compliance courses require a completion deadline before they can be published',
        ErrorCodes.COMPLIANCE_DEADLINE_REQUIRED,
        400,
        'certificate.deadline'
      );
    }

    if (data.certificate?.requiredExerciseId) {
      const ok = await exerciseBelongsToCourse(data.certificate.requiredExerciseId, courseId, dbClient);
      if (!ok) {
        throw new AppError('Certification exercise must belong to this course', ErrorCodes.VALIDATION_ERROR, 400);
      }

      await updateExercise(data.certificate.requiredExerciseId, { allowMultipleAttempts: true }, dbClient);
    }

    const updated = await updateCourseQuery(courseId, sanitizeUnknownStrings(sanitizedData), dbClient);
    if (!updated) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    const isContentGroupingEnabled = (updated.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING) === true;

    if (isContentGroupingEnabled) {
      const courseWithRelations = dbClient === db ? await getCourseWithRelations(courseId) : null;
      const contentItems =
        dbClient === db
          ? courseWithRelations?.contentItems
          : await getCourseContentItems(courseId, undefined, dbClient);

      if (contentItems) {
        const hasSections = contentItems.some((item) => item.type === ContentType.Section);
        const hasUngroupedItems = contentItems.some(
          (item) => (item.type === ContentType.Lesson || item.type === ContentType.Exercise) && item.sectionId === null
        );

        if (!hasSections && hasUngroupedItems) {
          const createSectionAndMoveContent = async (transactionClient: DbOrTxClient) => {
            const [section] = await createCourseSections(
              [
                {
                  title: DEFAULT_SECTION_TITLE,
                  order: 1,
                  courseId
                }
              ],
              transactionClient
            );

            if (!section) {
              throw new AppError('Failed to create course section', ErrorCodes.COURSE_SECTION_NOT_FOUND, 500);
            }

            await updateLessonsSectionId(courseId, section.id, transactionClient);
            await updateExercisesSectionId(courseId, section.id, transactionClient);
          };

          if (dbClient === db) {
            await db.transaction((tx) => createSectionAndMoveContent(tx));
          } else {
            await createSectionAndMoveContent(dbClient);
          }
        }
      }
    }

    if (data.status !== undefined) {
      const statsOrgId = await getOrgIdByCourseId(courseId, dbClient);
      await invalidateOrgStats(statsOrgId);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Soft deletes a course by setting status to 'DELETED'
 * @param courseId Course ID
 * @returns Deleted course
 */
export async function deleteCourse(courseId: string) {
  try {
    const statsOrgId = await getOrgIdByCourseId(courseId);
    const deleted = await deleteCourseQuery(courseId);
    if (!deleted) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    await invalidateOrgStats(statsOrgId);

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete course',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets course progress for a profile
 * @param courseId Course ID
 * @param profileId Profile ID
 * @returns Course progress with counts
 */
export async function getCourseProgress(courseId: string, profileId: string) {
  try {
    const progress = await getCourseProgressQuery(courseId, profileId);
    return progress;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get course progress',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets course analytics including student progress, completion rates, and grades
 * @param courseId Course ID
 * @returns Course analytics data
 */
export async function getCourseAnalytics(courseId: string) {
  try {
    // Get course with members (no profileId needed for analytics)
    const course = await getCourseWithRelations(courseId);
    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    // Get all members
    const members = course.group?.members || [];

    // Filter students and tutors
    const students = members.filter((member) => member.roleId === ROLE.STUDENT);
    const tutors = members.filter((member) => member.roleId === ROLE.ADMIN || member.roleId === ROLE.TUTOR);

    // Get lessons and exercises
    const lessons = course.contentItems.filter((item) => item.type === ContentType.Lesson);
    const exercises = course.contentItems.filter((item) => item.type === ContentType.Exercise);

    // Get student analytics
    const studentProfileIds = students
      .map((student) => student.profileId)
      .filter((profileId): profileId is string => profileId !== null);
    const lastSeenByProfileId = await getLastSeenForUserIds(studentProfileIds);

    const studentAnalytics = await Promise.all(
      students
        .filter((student) => student.profileId !== null)
        .map(async (student) => {
          try {
            const [courseProgress, userExercisesStats] = await Promise.all([
              getCourseProgressQuery(courseId, student.profileId!),
              getUserExercisesStats(courseId, student.profileId!)
            ]);

            if (!courseProgress) {
              return null;
            }

            const completedExercises = userExercisesStats?.filter((exercise) => exercise.isCompleted)?.length || 0;
            const totalExercises = userExercisesStats?.length || 0;

            const totalEarnedPoints = userExercisesStats?.reduce((sum, exercise) => sum + exercise.score, 0) || 0;
            const totalPoints = userExercisesStats?.reduce((sum, exercise) => sum + exercise.totalPoints, 0) || 0;
            const averageGrade = calcPercentageWithRounding(totalEarnedPoints, totalPoints);

            const lessonsCompleted = courseProgress.lessonsCompleted || 0;
            const totalLessons = courseProgress.lessonsCount || 0;
            const progressPercentage = calcPercentageWithRounding(lessonsCompleted, totalLessons);
            const lastSeen = lastSeenByProfileId.get(student.profileId!) ?? undefined;

            return {
              id: student.profileId,
              profile: {
                fullname: student.profile?.fullname || 'Unknown',
                email: student.profile?.email || '',
                avatar_url: student.profile?.avatarUrl || ''
              },
              lessonsCompleted,
              totalLessons,
              exercisesSubmitted: completedExercises,
              totalExercises,
              averageGrade,
              lastSeen,
              progressPercentage
            };
          } catch (error) {
            console.error('Error getting student overview:', error);
            return null;
          }
        })
    );

    const validStudentAnalytics = studentAnalytics.filter(
      (student): student is NonNullable<typeof student> => student !== null
    );

    // Calculate aggregated metrics
    let lessonCompletionRate = 0;
    let exerciseCompletionRate = 0;
    let averageGrade = 0;

    if (validStudentAnalytics.length > 0) {
      lessonCompletionRate = Math.round(
        validStudentAnalytics.reduce((sum, student) => sum + student.progressPercentage, 0) /
          validStudentAnalytics.length
      );

      exerciseCompletionRate = Math.round(
        validStudentAnalytics.reduce((sum, student) => {
          const completionRate =
            student.totalExercises > 0 ? (student.exercisesSubmitted / student.totalExercises) * 100 : 0;
          return sum + completionRate;
        }, 0) / validStudentAnalytics.length
      );

      averageGrade = Math.round(
        validStudentAnalytics.reduce((sum, student) => sum + student.averageGrade, 0) / validStudentAnalytics.length
      );
    }

    return {
      totalTutors: tutors.length,
      totalStudents: students.length,
      totalLessons: lessons.length,
      totalExercises: exercises.length,
      lessonCompletionRate,
      exerciseCompletionRate,
      averageGrade,
      students: validStudentAnalytics
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get course analytics',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets user course analytics for a specific course
 * @param courseId Course ID
 * @param userId User ID (profile ID)
 * @returns User course analytics data
 */
export async function getUserCourseAnalytics(
  courseId: string,
  userId: string,
  options: { includeProgressImpact?: boolean } = {}
) {
  try {
    // Get user profile
    const profile = await getProfileById(userId);
    if (!profile) {
      throw new AppError('User profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }

    const lastSeen = await getLastLogin(userId);

    // Fetch user exercises stats, lessons with completion, and course progress
    const [userExercisesStats, lessons, courseProgress] = await Promise.all([
      getUserExercisesStats(courseId, userId),
      getLessonsWithCompletion(courseId, userId),
      getProfileCourseProgress(courseId, userId)
    ]);

    if (!userExercisesStats || !lessons || !courseProgress) {
      throw new AppError('Failed to fetch course analytics data', ErrorCodes.INTERNAL_ERROR, 500);
    }

    // Calculate metrics
    const totalEarnedPoints = userExercisesStats.reduce((sum, exercise) => sum + exercise.score, 0);
    const totalPoints = userExercisesStats.reduce((sum, exercise) => sum + exercise.totalPoints, 0);
    const averageGrade = calcPercentageWithRounding(totalEarnedPoints, totalPoints);

    const completedLessons = lessons.filter((lesson) => lesson.completed);
    const progressPercentage = calcPercentageWithRounding(completedLessons.length, lessons.length);

    const completedExercises = userExercisesStats.filter((exercise) => exercise.isCompleted).length;
    const totalExercises = courseProgress.exercises_count || 0;

    let progressImpact = null;

    if (options.includeProgressImpact) {
      const groupId = await getCourseGroupId(courseId);

      if (groupId) {
        const [groupMember] = await db
          .select({ id: schema.groupmember.id })
          .from(schema.groupmember)
          .where(and(eq(schema.groupmember.groupId, groupId), eq(schema.groupmember.profileId, userId)))
          .limit(1);

        if (groupMember) {
          progressImpact = await getStudentCourseProgressImpactCounts({
            courseId,
            groupMemberId: groupMember.id,
            profileId: userId
          });
        }
      }
    }

    return {
      user: {
        id: userId,
        fullName: profile.fullname || '',
        email: profile.email || '',
        avatarUrl: profile.avatarUrl || '',
        lastSeen: lastSeen || undefined
      },
      averageGrade,
      userExercisesStats,
      totalExercises,
      completedExercises,
      progressPercentage,
      progressImpact
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get user exercises stats', ErrorCodes.INTERNAL_ERROR, 500);
  }
}

export type { CourseContent, CourseContentItem } from './utils';
