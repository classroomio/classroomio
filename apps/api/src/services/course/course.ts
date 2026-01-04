import { AppError, ErrorCodes } from '@api/utils/errors';
import { addGroupMember, createGroup } from '@cio/db/queries/group';
import {
  createCourseNewsfeed,
  createCourse as createCourseQuery,
  deleteCourse as deleteCourseQuery,
  getCourseProgress as getCourseProgressQuery,
  getCourseWithRelations,
  updateCourse as updateCourseQuery
} from '@cio/db/queries/course';
import {
  getLastLogin,
  getLessonsWithCompletion,
  getProfileCourseProgress,
  getUserExercisesStats
} from '@cio/db/queries/analytics/analytics';

import { ROLE } from '@cio/utils/constants';
import type { TCourse } from '@cio/db/types';
import { db } from '@cio/db/drizzle';
import { getCourseMembers } from '@cio/db/queries/course/people';
import { getExercisesByCourseId } from '@cio/db/queries/exercise/exercise';
import { getLessonsByCourseId } from '@cio/db/queries/lesson/lesson';
import { getProfileById } from '@cio/db/queries/auth';

/**
 * Gets a course by ID or slug with all related data
 * @param courseId Course ID (optional if slug provided)
 * @param slug Course slug (optional if courseId provided)
 * @returns Course with all related data
 */
export async function getCourse(courseId?: string, slug?: string) {
  try {
    if (!courseId && !slug) {
      throw new AppError('Either courseId or slug must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const course = await getCourseWithRelations(courseId, slug);
    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    return course;
  } catch (error) {
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
  data: { title: string; description: string; type: 'LIVE_CLASS' | 'SELF_PACED'; organizationId: string }
): Promise<{ course: TCourse; groupId: string; memberId: string }> {
  try {
    const result = await db.transaction(async () => {
      // 1. Create group
      const [newGroup] = await createGroup({
        name: data.title,
        description: data.description,
        organizationId: data.organizationId
      });

      if (!newGroup) {
        throw new AppError('Failed to create group', ErrorCodes.INTERNAL_ERROR, 500);
      }

      // 2. Create course with group_id
      const [newCourse] = await createCourseQuery({
        title: data.title,
        description: data.description,
        type: data.type,
        version: 'V2',
        groupId: newGroup.id
      });

      if (!newCourse) {
        throw new AppError('Failed to create course', ErrorCodes.INTERNAL_ERROR, 500);
      }

      // 3. Add group member (creator as TUTOR)
      const [newMember] = await addGroupMember({
        profileId,
        groupId: newGroup.id,
        roleId: ROLE.TUTOR
      });

      if (!newMember) {
        throw new AppError('Failed to add group member', ErrorCodes.INTERNAL_ERROR, 500);
      }

      // 4. Add default news feed
      await createCourseNewsfeed({
        content: `<h2>Welcome to this course 🎉&nbsp;</h2>
<p>Thank you for joining this course and I hope you get the best out of it.</p>`,
        courseId: newCourse.id,
        isPinned: true,
        authorId: newMember.id
      });

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
    const updated = await updateCourseQuery(courseId, data);
    if (!updated) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
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
 * Calculates percentage with rounding
 */
function calcPercentageWithRounding(a: number, b: number): number {
  if (b === 0) return 0;
  const percentage = (a / b) * 100;
  const roundedNumber = Math.round(percentage);
  return isNaN(roundedNumber) ? 0 : roundedNumber;
}

/**
 * Formats last seen time
 */
function formatLastSeen(lastLoginDate: string | null | undefined): string {
  if (!lastLoginDate) return 'Never';

  const lastLogin = new Date(lastLoginDate);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }
}

/**
 * Gets course analytics including student progress, completion rates, and grades
 * @param courseId Course ID
 * @returns Course analytics data
 */
export async function getCourseAnalytics(courseId: string) {
  try {
    // Get course with members
    const course = await getCourseWithRelations(courseId);
    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    // Get all members
    const members = await getCourseMembers(courseId);

    // Filter students and tutors
    const students = members.filter((member) => member.roleId === ROLE.STUDENT);
    const tutors = members.filter((member) => member.roleId === ROLE.ADMIN || member.roleId === ROLE.TUTOR);

    // Get lessons and exercises
    const lessons = await getLessonsByCourseId(courseId);
    const exercises = await getExercisesByCourseId(courseId);

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
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get user course analytics',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
