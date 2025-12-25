/**
 * Example: Organization service with cache invalidation
 * This file demonstrates how to invalidate cache when data changes
 * 
 * IMPORTANT: When you update data that is cached, you must invalidate
 * the related cache entries to prevent serving stale data.
 */

import { invalidateOrgCache, invalidateOrgCoursesCache, invalidateOrgTeamCache } from '@api/utils/cache-invalidation';

/**
 * Example: Update organization with cache invalidation
 */
export async function updateOrgExample(orgId: string, data: Partial<TOrganization>) {
  try {
    const organization = await updateOrganization(orgId, data);
    if (!organization) {
      throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
    }

    // Invalidate all organization-related cache entries
    await invalidateOrgCache(orgId, organization.siteName);

    return organization;
  } catch (error) {
    // Error handling...
  }
}

/**
 * Example: Create course with cache invalidation
 */
export async function createCourseExample(data: TNewCourse) {
  try {
    const course = await createCourseQuery(data);

    // Invalidate courses cache for the organization
    await invalidateOrgCoursesCache(data.siteName);

    return course;
  } catch (error) {
    // Error handling...
  }
}

/**
 * Example: Invite team members with cache invalidation
 */
export async function inviteTeamMembersExample(orgId: string, emails: string[], roleId: number) {
  try {
    const members = await createOrganizationMembers(orgId, emails, roleId);

    // Invalidate team cache since team members changed
    await invalidateOrgTeamCache(orgId);

    return members;
  } catch (error) {
    // Error handling...
  }
}

/**
 * Example: Remove team member with cache invalidation
 */
export async function removeTeamMemberExample(orgId: string, memberId: string) {
  try {
    await deleteOrganizationMember(orgId, memberId);

    // Invalidate team cache since team members changed
    await invalidateOrgTeamCache(orgId);

    return;
  } catch (error) {
    // Error handling...
  }
}