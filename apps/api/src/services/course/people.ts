import * as schema from '@cio/db/schema';

import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  addCourseMember,
  deleteCourseMember,
  getCourseMember,
  getCourseMembers,
  updateCourseMember
} from '@cio/db/queries/course/people';
import { and, eq, or, db } from '@cio/db/drizzle';

import { ROLE } from '@cio/utils/constants';
import type { TAddCourseMembers } from '@cio/utils/validation/course/people';
import type { TGroupmember } from '@cio/db/types';
import { env } from '@api/config/env';
import { sendEmail } from '@cio/email';

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

    const addedMember = await addCourseMember(courseId, data);

    // Send emails when a student joins
    if (data.roleId === ROLE.STUDENT) {
      try {
        // Get course and organization data
        const courseOrgData = await db
          .select({
            courseTitle: schema.course.title,
            orgName: schema.organization.name
          })
          .from(schema.course)
          .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
          .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
          .where(eq(schema.course.id, courseId))
          .limit(1);

        if (courseOrgData.length > 0) {
          const courseName = courseOrgData[0].courseTitle || '';
          const orgName = courseOrgData[0].orgName || 'ClassroomIO';

          // Get student profile data
          let studentEmail: string | null = null;
          let studentName: string | null = null;

          if (data.profileId) {
            const studentProfile = await db
              .select({
                email: schema.profile.email,
                fullname: schema.profile.fullname
              })
              .from(schema.profile)
              .where(eq(schema.profile.id, data.profileId))
              .limit(1);

            if (studentProfile.length > 0) {
              studentEmail = studentProfile[0].email;
              studentName = studentProfile[0].fullname;
            }
          } else if (data.email) {
            studentEmail = data.email;
            studentName = data.name || null;
          }

          // Send welcome email to student
          if (studentEmail) {
            try {
              await sendEmail('studentCourseWelcome', {
                to: studentEmail,
                fields: {
                  orgName,
                  courseName
                },
                from: `"${orgName} (via ClassroomIO.com)" <notify@mail.classroomio.com>`
              });
            } catch (emailError) {
              console.error('Failed to send student welcome email:', emailError);
            }
          }

          // Get all teachers (ADMIN or TUTOR) in the course
          const teachersResult = await db
            .select({
              email: schema.profile.email
            })
            .from(schema.groupmember)
            .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
            .innerJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
            .where(
              and(
                eq(schema.course.id, courseId),
                or(eq(schema.groupmember.roleId, ROLE.ADMIN), eq(schema.groupmember.roleId, ROLE.TUTOR))
              )
            );

          // Send notification to all teachers
          if (teachersResult.length > 0 && studentEmail && studentName) {
            const teacherEmails = teachersResult.map((t) => t.email).filter((email): email is string => email !== null);

            await Promise.all(
              teacherEmails.map((teacherEmail) =>
                sendEmail('teacherStudentJoined', {
                  to: teacherEmail,
                  fields: {
                    courseName,
                    studentName,
                    studentEmail
                  },
                  from: '"ClassroomIO" <notify@mail.classroomio.com>'
                }).catch((emailError) => {
                  console.error(`Failed to send teacher notification email to ${teacherEmail}:`, emailError);
                })
              )
            );
          }
        }
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send student join emails:', emailError);
      }
    }

    return addedMember;
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

    // Send welcome emails to teachers
    const teacherEmailPromises: Promise<unknown>[] = [];

    addedMembers.forEach((member, index) => {
      const memberData = members[index];
      // Only send emails to teachers (TUTOR or ADMIN role) who have email
      const roleId = memberData.roleId;
      const email = memberData.email;
      const name = memberData.name;

      if ((roleId === ROLE.ADMIN || roleId === ROLE.TUTOR) && email && name) {
        teacherEmailPromises.push(
          sendEmail('teacherCourseWelcome', {
            to: email,
            fields: {
              name,
              orgName,
              courseName,
              inviteLink
            },
            from: `"${orgName} (via ClassroomIO.com)" <notify@mail.classroomio.com>`
          }).catch((emailError) => {
            console.error(`Failed to send welcome email to ${email}:`, emailError);
            return [];
          })
        );
      }
    });

    if (teacherEmailPromises.length > 0) {
      try {
        await Promise.all(teacherEmailPromises);
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
