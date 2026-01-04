import * as schema from '@cio/db/schema';

import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  addCourseMember,
  deleteCourseMember,
  getCourseMember,
  getCourseMembers,
  updateCourseMember
} from '@cio/db/queries/course/people';

import type { TAddCourseMembers } from '@cio/utils/validation/course/people';
import type { TGroupmember } from '@cio/db/types';
import { db } from '@cio/db/drizzle';
import { deliverEmail } from '@cio/email';
import { env } from '@api/config/env';
import { eq } from 'drizzle-orm';

/**
 * Gets all course members (people) for a course
 * @param courseId Course ID
 * @returns Array of course members with profile data
 */
export async function listCourseMembers(courseId: string) {
  try {
    return getCourseMembers(courseId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list course members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Adds a course member (person) to a course
 * @param courseId Course ID
 * @param data Member data (profileId, roleId, email, name)
 * @returns Created member
 */
export async function addMember(
  courseId: string,
  data: { profileId?: string; roleId: number; email?: string; name?: string }
) {
  try {
    if (!data.profileId && !data.email) {
      throw new AppError('Either profileId or email must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    return addCourseMember(courseId, data);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add course member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Adds multiple course members to a course and optionally sends welcome emails
 * @param courseId Course ID
 * @param members Array of member data
 * @returns Array of created members
 */
export async function addMembers(courseId: string, members: TAddCourseMembers) {
  try {
    if (members.length === 0) {
      throw new AppError('At least one member must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate all members
    for (const member of members) {
      if (!member.profileId && !member.email) {
        throw new AppError(
          'Either profileId or email must be provided for each member',
          ErrorCodes.VALIDATION_ERROR,
          400
        );
      }
    }

    // Get course title and organization data for emails (simple query, no expensive joins)
    const courseOrgData = await db
      .select({
        courseTitle: schema.course.title,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (courseOrgData.length === 0) {
      throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
    }

    const courseName = courseOrgData[0].courseTitle || '';
    const orgName = courseOrgData[0].orgName || 'ClassroomIO';
    const orgSiteName = courseOrgData[0].orgSiteName || '';

    // Add all members
    const addedMembers = await Promise.all(members.map((member) => addCourseMember(courseId, member)));

    // Send welcome emails for teachers (TUTOR role = 2, ADMIN role = 1)
    const baseUrl = env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.classroomio.com';
    const inviteLink = `${baseUrl}/org/${orgSiteName}/courses`;

    const emailPromises = addedMembers
      .filter((member, index) => {
        // Only send emails to teachers (TUTOR or ADMIN role) who have email
        const memberData = members[index];
        const roleId = memberData.roleId;
        const email = memberData.email;
        return (roleId === 1 || roleId === 2) && email && memberData.name;
      })
      .map((member, index) => {
        const memberData = members[index];
        const email = memberData.email;
        const name = memberData.name;

        return {
          from: `"${orgName} (via ClassroomIO.com)" <notify@mail.classroomio.com>`,
          to: email!,
          subject: `You have been invited to a course in ${orgName}!`,
          content: `
            <p>Hey ${name},</p>
            <p>You have been given access to teach a course by ${orgName}</p>
            <p>The course is titled: ${courseName}</p>
            <div>
              <a class="button" href="${inviteLink}">Open Dashboard</a>
            </div>
          `
        };
      });

    if (emailPromises.length > 0) {
      try {
        await deliverEmail(emailPromises);
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send welcome emails:', emailError);
      }
    }

    return addedMembers;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add course members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @param data Partial member data to update
 * @returns Updated member
 */
export async function updateMember(courseId: string, memberId: string, data: Partial<TGroupmember>) {
  try {
    const updated = await updateCourseMember(courseId, memberId, data);
    if (!updated) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }
    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @returns Deleted member
 */
export async function deleteMember(courseId: string, memberId: string) {
  try {
    const deleted = await deleteCourseMember(courseId, memberId);
    if (!deleted) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }
    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete course member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
