import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TNewOrganizationPlan, TOrganization, TOrganizationPlan, TPlan } from '@db/types';
import {
  cancelOrganizationPlan,
  createOrganizationPlan,
  getOrganizationAudience,
  getOrganizationTeam,
  getOrganizations,
  updateOrganization,
  updateOrganizationPlan
} from '@cio/db/queries/organization';

import { getCoursesBySiteName } from '@cio/db/queries/course';

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
