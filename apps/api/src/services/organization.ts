import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TNewOrganizationPlan, TOrganization, TOrganizationPlan, TPlan } from '@db/types';
import {
  cancelOrganizationPlan,
  checkEmailsExistInOrg,
  createOrganizationMembers,
  createOrganizationPlan,
  deleteOrganizationMember,
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
  getCoursesBySiteName,
  getCoursesBySiteNameForSetup,
  getExercisesBySiteName,
  getLessonsBySiteName
} from '@cio/db/queries/course';

import { createOrganizationWithOwner } from '@api/services/onboarding';
import { env } from '@api/config/env';
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
 * Gets courses by organization siteName
 * @param siteName - The organization site name
 * @returns Array of courses
 */
export async function getCoursesByOrgSiteName(siteName: string) {
  try {
    const courses = await getCoursesBySiteName(siteName);
    return courses;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch courses',
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
    const courses = await getCoursesById(orgId);
    return courses;
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
