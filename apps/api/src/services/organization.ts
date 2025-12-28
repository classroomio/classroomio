import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TNewOrganizationPlan, TOrganization, TOrganizationPlan, TPlan } from '@db/types';
import {
  cancelOrganizationPlan,
  checkEmailsExistInOrg,
  createOrganizationMembers,
  createOrganizationPlan,
  deleteOrganizationMember,
  getOrgIdBySiteName,
  getOrganizationAudience,
  getOrganizationById,
  getOrganizationBySiteName,
  getOrganizationTeam,
  getOrganizations,
  updateOrganization,
  updateOrganizationPlan
} from '@cio/db/queries/organization';
import {
  getCoursesById,
  getCoursesBySiteNameForSetup,
  getEnrolledCourses,
  getExercisesBySiteName,
  getExploreCourses,
  getLessonsBySiteName,
  getOrgCourses,
  getPublishedCoursesBySiteName
} from '@cio/db/queries/course';
import { getLastLogin, getProfileCourseProgress, getUserExercisesStats } from '@cio/db/queries/analytics';

import { ROLE } from '@cio/utils/constants';
import { createOrganizationWithOwner } from '@api/services/onboarding';
import { env } from '@api/config/env';
import { getProfileById } from '@cio/db/queries/auth';
import { sendEmail } from '@cio/email';

/**
 * Creates a new organization with the current user as owner
 * @param profileId - The profile ID of the user creating the organization
 * @param data - Organization creation data (name, siteName)
 * @returns Created organization, member, and updated organizations list
 */
export async function createOrg(profileId: string, data: { name: string; siteName: string }) {
  try {
    // Reuse existing function from onboarding service
    return await createOrganizationWithOwner(profileId, {
      orgName: data.name,
      siteName: data.siteName
    });
  } catch (error) {
    // Re-throw AppError as-is
    if (error instanceof AppError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create organization',
      ErrorCodes.ORG_CREATE_FAILED,
      500
    );
  }
}

/**
 * Gets organizations with optional filters
 * @param filters - Filter options (siteName, customDomain, isCustomDomainVerified)
 * @returns Array of organizations with plans
 */
export async function getOrganizationsWithFilters(filters?: {
  siteName?: string;
  customDomain?: string;
  isCustomDomainVerified?: boolean;
}) {
  try {
    const organizations = await getOrganizations(filters);
    return organizations;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch organizations',
      ErrorCodes.ORGANIZATION_NOT_FOUND,
      500
    );
  }
}

/**
 * Gets organization team members (non-students)
 * @param orgId - The organization ID
 * @returns Array of team members
 */
export async function getOrgTeam(orgId: string) {
  try {
    const team = await getOrganizationTeam(orgId);
    return team;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch organization team',
      ErrorCodes.ORG_TEAM_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets organization audience (students)
 * @param orgId - The organization ID
 * @returns Array of student profiles
 */
export async function getOrgAudience(orgId: string) {
  try {
    const audience = await getOrganizationAudience(orgId);
    return audience;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch organization audience',
      ErrorCodes.ORG_AUDIENCE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets public courses for an organization (landing page)
 * @param siteName - The organization siteName
 * @returns Array of published courses with lesson counts
 */
export async function getPublicCourses(siteName: string) {
  try {
    const orgResult = await getOrgIdBySiteName(siteName);
    const org = orgResult[0];

    if (!org) {
      throw new AppError('Organization not found', ErrorCodes.ORG_NOT_FOUND, 404);
    }

    return getPublishedCoursesBySiteName(siteName);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch public courses',
      ErrorCodes.COURSES_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets organization courses with role-based data filtering
 * @param orgId - The organization ID
 * @param userId - User ID for role-based filtering (required)
 * @param userRole - User's role in the organization (from context)
 * @returns Object with role and courses array
 * - Admins: all courses with totalStudents
 * - Tutors: assigned courses with totalStudents
 */
export async function getOrganizationCourses(orgId: string, userId: string, userRole: number) {
  try {
    if (!userRole) {
      throw new AppError('Invalid permissions', ErrorCodes.UNAUTHORIZED, 403);
    }

    switch (userRole) {
      case ROLE.ADMIN:
        return getOrgCourses({ orgId });
      case ROLE.TUTOR:
        return getOrgCourses({ orgId, profileId: userId });
      default:
        throw new AppError('Invalid permissions', ErrorCodes.UNAUTHORIZED, 403);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch courses',
      ErrorCodes.COURSES_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets user enrolled courses by organization orgId
 *
 * @param orgId - The organization ID
 * @param userId - User ID for filtering
 * @returns Array of enrolled courses
 */
export async function getUserEnrolledCourses(orgId: string, userId: string) {
  try {
    return getEnrolledCourses({ orgId, profileId: userId });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch enrolled courses',
      ErrorCodes.COURSES_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets recommended courses (published courses user isn't enrolled in) for an organization
 * Used in LMS explore page
 *
 * @param orgId - The organization ID
 * @param userId - User ID to exclude enrolled courses
 * @returns Array of recommended courses
 */
export async function getRecommendedCourses(orgId: string, userId: string) {
  try {
    return getExploreCourses({ orgId, profileId: userId });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch recommended courses',
      ErrorCodes.COURSES_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets courses by organization orgId
 * @param orgId - The organization orgId
 * @returns Array of courses
 */
export async function getCoursesByOrgId(orgId: string) {
  try {
    return getCoursesById(orgId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch courses',
      ErrorCodes.COURSES_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets setup data for an organization
 * @param siteName - The organization site name
 * @returns Setup data including courses, lessons, exercises, and organization info
 */
export async function getOrgSetupData(siteName: string) {
  try {
    const [organization, courses, lessons, exercises] = await Promise.all([
      getOrganizationBySiteName(siteName),
      getCoursesBySiteNameForSetup(siteName),
      getLessonsBySiteName(siteName),
      getExercisesBySiteName(siteName)
    ]);

    // Check if course is published
    const publishedCourse = courses.find((course) => course.isPublished === true);

    // Get organization avatar URL directly from organization
    const orgHasAvatarUrl = !!organization?.avatarUrl;

    return {
      isCoursePublished: !!publishedCourse,
      isCourseCreated: courses.length > 0,
      orgHasAvatarUrl,
      courseData: courses,
      lessonData: lessons,
      isLessonCreated: lessons.length > 0,
      isExerciseCreated: exercises.length > 0
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch setup data',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates a new organization plan
 * @param data - Organization plan creation data
 * @returns Created organization plan
 */
export async function createOrgPlan(data: TNewOrganizationPlan) {
  try {
    const plan = await createOrganizationPlan({
      orgId: data.orgId,
      planName: data.planName,
      subscriptionId: data.subscriptionId,
      triggeredBy: data.triggeredBy,
      payload: data.payload,
      isActive: true,
      provider: 'polar'
    });
    return plan;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create organization plan',
      ErrorCodes.ORG_PLAN_CREATE_FAILED,
      500
    );
  }
}

/**
 * Updates an organization
 * @param orgId - The organization ID
 * @param data - Partial organization data to update
 * @returns Updated organization
 */
export async function updateOrg(orgId: string, data: Partial<TOrganization>) {
  try {
    const organization = await updateOrganization(orgId, data);
    if (!organization) {
      throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
    }
    return organization;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update organization',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates an organization plan
 * @param subscriptionId - Subscription ID
 * @param payload - Payload data to update
 * @returns Updated organization plan
 */
export async function updateOrgPlan(subscriptionId: string, payload: TOrganizationPlan['payload']) {
  try {
    const plan = await updateOrganizationPlan(subscriptionId, payload);
    if (!plan) {
      throw new AppError('Organization plan not found', ErrorCodes.ORG_PLAN_NOT_FOUND, 404);
    }
    return plan;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update organization plan',
      ErrorCodes.ORG_PLAN_UPDATE_FAILED,
      500
    );
  }
}

/**
 * Cancels an organization plan
 * @param subscriptionId - Subscription ID
 * @param payload - Payload data to update
 * @returns Updated organization plan
 */
export async function cancelOrgPlan(subscriptionId: string, payload: TOrganizationPlan['payload']) {
  try {
    const plan = await cancelOrganizationPlan(subscriptionId, payload);
    if (!plan) {
      throw new AppError('Organization plan not found', ErrorCodes.ORG_PLAN_NOT_FOUND, 404);
    }
    return plan;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to cancel organization plan',
      ErrorCodes.ORG_PLAN_CANCEL_FAILED,
      500
    );
  }
}

/**
 * Invites team members to an organization
 * @param orgId - The organization ID
 * @param emails - Array of email addresses to invite
 * @param roleId - Role ID to assign (ADMIN or TUTOR)
 * @returns Array of created members
 */
export async function inviteTeamMembers(orgId: string, emails: string[], roleId: number) {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const normalizedEmails = [...new Set(emails.map((email) => email.toLowerCase().trim()))];

  const existingEmails = await checkEmailsExistInOrg(orgId, normalizedEmails);
  const emailsToInvite = normalizedEmails.filter((email) => !existingEmails.includes(email));

  if (emailsToInvite.length === 0) {
    return [];
  }

  try {
    const members = await createOrganizationMembers(
      emailsToInvite.map((email) => ({
        organizationId: orgId,
        email,
        roleId,
        verified: false
      }))
    );

    const baseUrl = env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.classroomio.com';

    for (const email of emailsToInvite) {
      try {
        const inviteData = JSON.stringify({
          email,
          orgId: organization.id,
          orgSiteName: organization.siteName
        });
        const inviteLink = `${baseUrl}/invite/t/${encodeURIComponent(btoa(inviteData))}`;

        await sendEmail('inviteTeacher', {
          to: email,
          fields: {
            email,
            orgName: organization.name,
            orgSiteName: organization.siteName,
            inviteLink
          }
        });
      } catch (emailError) {
        console.error(`Failed to send invite email to ${email}:`, emailError);
      }
    }

    return members;
  } catch (error) {
    console.error('Error inviting team members:', error);
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to invite team members',
      ErrorCodes.ORG_TEAM_INVITE_FAILED,
      500
    );
  }
}

/**
 * Removes a team member from an organization
 * @param orgId - The organization ID
 * @param memberId - The member ID to remove
 * @returns Deleted member
 */
export async function removeTeamMember(orgId: string, memberId: number) {
  try {
    const deleted = await deleteOrganizationMember(orgId, memberId);
    if (!deleted) {
      throw new AppError('Team member not found', ErrorCodes.ORG_TEAM_REMOVE_FAILED, 404);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to remove team member',
      ErrorCodes.ORG_TEAM_REMOVE_FAILED,
      500
    );
  }
}

/**
 * Helper function to sum array object values by key
 */
function sumArrObject<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + ((item[key] as number) || 0), 0);
}

/**
 * Helper function to calculate percentage with rounding
 */
function calcPercentageWithRounding(a: number, b: number): number {
  if (b === 0) {
    return 0;
  }
  const rawPercentage = (a / b) * 100;
  const fixedString = rawPercentage.toFixed(1);
  const roundedNumber = parseFloat(fixedString);
  return isNaN(roundedNumber) ? 0 : roundedNumber;
}

/**
 * Gets user analytics for an organization
 * @param userId - The user ID (profile ID)
 * @param orgId - The organization ID
 * @returns User analytics data including courses, progress, and grades
 */
export async function getUserAnalytics(userId: string, orgId: string) {
  try {
    // Get user profile
    const profile = await getProfileById(userId);
    if (!profile) {
      throw new AppError('User profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }

    // Get last login
    const lastSeen = await getLastLogin(userId);

    // Get courses for this org where user is enrolled
    const courses = await getEnrolledCourses({ orgId, profileId: userId });

    // Build analytics data for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const [userExercisesStats, courseProgress] = await Promise.all([
          getUserExercisesStats(course.id, userId),
          getProfileCourseProgress(course.id, userId)
        ]);

        const totalEarnedPoints = sumArrObject(userExercisesStats, 'score');
        const totalPoints = sumArrObject(userExercisesStats, 'totalPoints');
        const averageGrade = calcPercentageWithRounding(totalEarnedPoints, totalPoints);
        const lessonsCompleted = courseProgress.lessons_completed || 0;
        const lessonsCount = courseProgress.lessons_count || 0;

        return {
          ...course,
          ...courseProgress,
          progress_percentage: calcPercentageWithRounding(lessonsCompleted, lessonsCount),
          average_grade: averageGrade
        };
      })
    );

    // Calculate overall stats
    const totalLessons = coursesWithStats.reduce((acc, course) => acc + (course.lessons_count || 0), 0);
    const completedLessons = coursesWithStats.reduce((acc, course) => acc + (course.lessons_completed || 0), 0);
    const overallCourseProgress = calcPercentageWithRounding(completedLessons, totalLessons);

    const allGrades = sumArrObject(coursesWithStats, 'average_grade');
    const overallAverageGrade = calcPercentageWithRounding(allGrades, coursesWithStats.length);

    return {
      user: {
        id: userId,
        fullName: profile.fullname || '',
        email: profile.email || '',
        avatarUrl: profile.avatarUrl || '',
        lastSeen: lastSeen || undefined
      },
      courses: coursesWithStats,
      overallCourseProgress,
      overallAverageGrade
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch user analytics',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
