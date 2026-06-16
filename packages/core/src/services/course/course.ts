import { AppError, ErrorCodes } from '@cio/utils/errors';
import { sanitizeHtml, sanitizeOptionalHtml, sanitizeUnknownStrings } from '../../utils/sanitize-html';
import {
  createCourseNewsfeed,
  createCourse as createCourseQuery,
  createCourseSections,
  deleteCourse as deleteCourseQuery,
  getCourseProgress as getCourseProgressQuery,
  getCourseTypeById,
  getCourseWithRelations,
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
  getLessonsWithCompletion,
  getProfileCourseProgress,
  getUserExercisesStats
} from '@cio/db/queries/analytics/analytics';

import { ContentType, ROLE } from '@cio/utils/constants';
import type { TCourse } from '@cio/db/types';
import type { TCourseCreate } from '@cio/utils/validation/course';
import { db } from '@cio/db/drizzle';
import { exerciseBelongsToCourse } from '@cio/db/queries/course/certification-exercise';
import { updateExercisesSectionId } from '@cio/db/queries/exercise/exercise';
import { getProfileById } from '@cio/db/queries/auth';
import { insertOrganizationMembersOnConflictDoNothing } from '@cio/db/queries/organization';
import { annotateCourseContentWithProgression } from './progression';
import { buildCourseContent, calcPercentageWithRounding, formatLastSeen, type CourseContent } from './utils';
import { guardCourseTypeTransition } from './public-course-guard';

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

  return true;
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

    const base = {
      ...rest,
      content,
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
export async function updateCourse(courseId: string, data: Partial<TCourse>) {
  try {
    const sanitizedData: Partial<TCourse> = {
      ...data,
      description: sanitizeOptionalHtml(data.description),
      overview: sanitizeOptionalHtml(data.overview),
      metadata: sanitizeCourseMetadata(data.metadata),
      certificate: sanitizeCourseCertificate(data.certificate),
      logo: data.logo,
      slug: data.slug
    };

    if (data.type !== undefined) {
      const currentType = await getCourseTypeById(courseId);

      await guardCourseTypeTransition({
        courseId,
        currentType: currentType ?? null,
        nextType: data.type
      });
    }

    if (data.certificate?.requiredExerciseId) {
      const ok = await exerciseBelongsToCourse(data.certificate.requiredExerciseId, courseId);
      if (!ok) {
        throw new AppError('Certification exercise must belong to this course', ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    const updated = await updateCourseQuery(courseId, sanitizeUnknownStrings(sanitizedData));
    if (!updated) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    const isContentGroupingEnabled = (updated.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING) === true;

    if (isContentGroupingEnabled) {
      const courseWithRelations = await getCourseWithRelations(courseId);
      if (courseWithRelations) {
        const contentItems = courseWithRelations.contentItems;
        const hasSections = contentItems.some((item) => item.type === ContentType.Section);
        const hasUngroupedItems = contentItems.some(
          (item) => (item.type === ContentType.Lesson || item.type === ContentType.Exercise) && item.sectionId === null
        );

        if (!hasSections && hasUngroupedItems) {
          await db.transaction(async (tx) => {
            const [section] = await createCourseSections(
              [
                {
                  title: DEFAULT_SECTION_TITLE,
                  order: 1,
                  courseId
                }
              ],
              tx
            );

            if (!section) {
              throw new AppError('Failed to create course section', ErrorCodes.COURSE_SECTION_NOT_FOUND, 500);
            }

            await updateLessonsSectionId(courseId, section.id, tx);
            await updateExercisesSectionId(courseId, section.id, tx);
          });
        }
      }
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
    const deleted = await deleteCourseQuery(courseId);
    if (!deleted) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }
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
    const studentAnalytics = await Promise.all(
      students
        .filter((student) => student.profileId !== null)
        .map(async (student) => {
          try {
            const [courseProgress, userExercisesStats, lastLoginDate] = await Promise.all([
              getCourseProgressQuery(courseId, student.profileId!),
              getUserExercisesStats(courseId, student.profileId!),
              getLastLogin(student.profileId!)
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
              lastSeen: formatLastSeen(lastLoginDate),
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
export async function getUserCourseAnalytics(courseId: string, userId: string) {
  try {
    // Get user profile
    const profile = await getProfileById(userId);
    if (!profile) {
      throw new AppError('User profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }

    // Get last login
    const lastLoginDate = await getLastLogin(userId);

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

    return {
      user: {
        id: userId,
        fullName: profile.fullname || '',
        email: profile.email || '',
        avatarUrl: profile.avatarUrl || '',
        lastSeen: formatLastSeen(lastLoginDate)
      },
      averageGrade,
      userExercisesStats,
      totalExercises,
      completedExercises,
      progressPercentage
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get user exercises stats', ErrorCodes.INTERNAL_ERROR, 500);
  }
}

export type { CourseContent, CourseContentItem } from './utils';
