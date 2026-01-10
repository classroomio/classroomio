import { AppError, ErrorCodes } from '@api/utils/errors';
import { isUserCourseMember, isUserCourseTeamMember } from '@cio/db/queries/group';

import { getCoursesById } from '@cio/db/queries/course';
import { getUserCourseRole } from '@cio/db/queries/group';
import { isUserOrgAdmin } from '@cio/db/queries/organization';

export interface CoursePermissions {
  hasAccess: boolean;
  isOrgAdmin: boolean;
  isCourseMember: boolean;
  isTeamMember: boolean;
  roleId: number | null;
}

/**
 * Gets user permissions for a course
 * @param courseId - The course ID
 * @param userId - The user ID
 * @returns Course permissions
 */
export async function getCoursePermissions(courseId: string, userId: string): Promise<CoursePermissions> {
  try {
    // Verify course exists
    const course = await getCoursesById(courseId);
    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    // Check if user is a course member
    const { isMember, organizationId } = await isUserCourseMember(courseId, userId);

    // Get user's role in the course
    const roleId = await getUserCourseRole(courseId, userId);

    // Check if user is a team member (admin/tutor)
    const { isTeamMember } = await isUserCourseTeamMember(courseId, userId);

    // Check if user is org admin
    let isOrgAdmin = false;
    if (organizationId) {
      isOrgAdmin = await isUserOrgAdmin(organizationId, userId);
    }

    // User has access if they're a course member or org admin
    const hasAccess = isMember || isOrgAdmin;

    return {
      hasAccess,
      isOrgAdmin,
      isCourseMember: isMember,
      isTeamMember: isTeamMember || false,
      roleId: roleId || null
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get course permissions',
      ErrorCodes.COURSE_FETCH_FAILED,
      500
    );
  }
}
