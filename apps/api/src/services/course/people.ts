import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  addCourseMember,
  deleteCourseMember,
  getCourseMember,
  getCourseMembers,
  getCourseTeachers,
  updateCourseMember
} from '@cio/db/queries/course/people';
import { resetStudentCourseProgress } from '@cio/db/queries/course/reset-progress';

import { ROLE } from '@cio/utils/constants';
import type { TAddCourseMembers } from '@cio/utils/validation/course/people';
import type { TGroupmember } from '@cio/db/types';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getCourseWithOrgData } from '@cio/db/queries/course';
import { getProfileById } from '@cio/db/queries/auth';
import { buildEmailFromName } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { ensureComplianceEnrollmentRecordsForProfiles } from './compliance';

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

    if (data.roleId === ROLE.STUDENT && data.profileId) {
      await ensureComplianceEnrollmentRecordsForProfiles([courseId], [data.profileId]);
    }

    // Send emails when a student joins
    if (data.roleId === ROLE.STUDENT) {
      try {
        // Get course and organization data
        const courseOrgData = await getCourseWithOrgData(courseId);

        if (courseOrgData) {
          const courseName = courseOrgData.courseTitle || '';
          const orgName = courseOrgData.orgName || 'ClassroomIO';
          const loginUrl = getDashboardBaseUrl({
            siteName: courseOrgData.orgSiteName,
            customDomain: courseOrgData.orgCustomDomain,
            isCustomDomainVerified: courseOrgData.orgIsCustomDomainVerified
          });

          // Get student profile data
          let studentEmail: string | null = null;
          let studentName: string | null = null;

          if (data.profileId) {
            const studentProfile = await getProfileById(data.profileId);

            if (studentProfile) {
              studentEmail = studentProfile.email;
              studentName = studentProfile.fullname;
            }
          } else if (data.email) {
            studentEmail = data.email;
            studentName = data.name || null;
          }

          if (studentEmail) {
            try {
              await enqueueTransactionalEmail('studentCourseWelcome', {
                to: studentEmail,
                fields: {
                  orgName,
                  courseName,
                  loginUrl
                },
                from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
                idempotencyKey: `course-people-student-welcome:${courseId}:${studentEmail}`
              });
            } catch (emailError) {
              console.error('Failed to enqueue student welcome email:', emailError);
            }
          }

          const teachersResult = await getCourseTeachers({ courseId });

          if (teachersResult.length > 0 && studentEmail && studentName) {
            const teacherEmails = teachersResult.map((t) => t.email).filter((email): email is string => email !== null);

            if (teacherEmails.length > 0) {
              try {
                await enqueueTransactionalEmail('teacherStudentJoined', {
                  to: teacherEmails,
                  fields: {
                    courseName,
                    studentName,
                    studentEmail
                  },
                  from: buildEmailFromName('ClassroomIO'),
                  idempotencyKey: `course-people-teacher-joined:${courseId}:${studentEmail}`
                });
              } catch (emailError) {
                console.error('Failed to enqueue teacher notification email:', emailError);
              }
            }
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
    const courseOrgData = await getCourseWithOrgData(courseId);

    if (!courseOrgData) {
      throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
    }

    const courseName = courseOrgData.courseTitle || '';
    const orgName = courseOrgData.orgName || 'ClassroomIO';
    const orgSiteName = courseOrgData.orgSiteName || '';

    // Add all members
    const addedMembers = await Promise.all(members.map((member) => addCourseMember(courseId, member)));
    const studentProfileIds = members
      .filter((member) => member.roleId === ROLE.STUDENT && member.profileId)
      .map((member) => member.profileId!);

    if (studentProfileIds.length > 0) {
      await ensureComplianceEnrollmentRecordsForProfiles([courseId], studentProfileIds);
    }

    // Send welcome emails for teachers (TUTOR role = 2, ADMIN role = 1)
    const baseUrl = getDashboardBaseUrl({
      siteName: orgSiteName,
      customDomain: courseOrgData.orgCustomDomain,
      isCustomDomainVerified: courseOrgData.orgIsCustomDomainVerified
    });
    const inviteLink = `${baseUrl}/org/${orgSiteName}/courses`;

    const teacherEmailPromises: Promise<unknown>[] = [];

    addedMembers.forEach((member, index) => {
      const memberData = members[index];
      const roleId = memberData.roleId;
      const email = memberData.email;
      const name = memberData.name;

      if ((roleId === ROLE.ADMIN || roleId === ROLE.TUTOR) && email && name) {
        teacherEmailPromises.push(
          enqueueTransactionalEmail('teacherCourseWelcome', {
            to: email,
            fields: {
              name,
              orgName,
              courseName,
              inviteLink
            },
            from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
            idempotencyKey: `teacher-course-welcome:${courseId}:${email}`
          }).catch((emailError) => {
            console.error(`Failed to enqueue welcome email to ${email}:`, emailError);
            return [];
          })
        );
      }
    });

    if (teacherEmailPromises.length > 0) {
      try {
        await Promise.all(teacherEmailPromises);
      } catch (emailError) {
        console.error('Failed to enqueue welcome emails:', emailError);
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

/**
 * Resets all learner progress for a course member while keeping them enrolled.
 */
export async function resetMemberCourseProgress(courseId: string, memberId: string, actorProfileId: string) {
  try {
    const member = await getCourseMember(courseId, memberId);
    if (!member || !member.profileId) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const summary = await resetStudentCourseProgress({
      courseId,
      groupMemberId: memberId,
      profileId: member.profileId
    });

    console.info('resetMemberCourseProgress', {
      actorProfileId,
      courseId,
      memberId,
      summary
    });

    return summary;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reset course member progress',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
