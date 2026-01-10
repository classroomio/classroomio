import * as schema from '@cio/db/schema';

import { AppError, ErrorCodes } from '@api/utils/errors';

import { db } from '@cio/db/drizzle';
import { eq } from 'drizzle-orm';
import { getCourseTeachers } from '@cio/db/queries/course/people';
import { sendEmail } from '@cio/email';

export interface PaymentRequestData {
  courseId: string;
  studentEmail: string;
  studentFullname: string;
}

/**
 * Creates a payment request and sends emails to teacher and student
 * @param data Payment request data
 */
export async function createPaymentRequest(data: PaymentRequestData) {
  try {
    // Get course and organization data
    const [course] = await db
      .select({
        courseTitle: schema.course.title,
        orgName: schema.organization.name,
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.course.id, data.courseId))
      .limit(1);

    if (!course) {
      throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
    }

    const courseName = course.courseTitle || '';
    const orgName = course.orgName || 'ClassroomIO';
    const groupId = course.groupId;

    if (!groupId) {
      throw new AppError('Course group not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Get first teacher (TUTOR or ADMIN) email
    const teacherResult = await getCourseTeachers({ groupId, limit: 1 });

    if (teacherResult.length === 0 || !teacherResult[0]?.email) {
      throw new AppError('No teacher found for this course', ErrorCodes.NOT_FOUND, 404);
    }

    const teacherEmail = teacherResult[0].email;

    // Send email to teacher about student buy request
    try {
      await sendEmail('teacherStudentBuyRequest', {
        to: teacherEmail,
        fields: {
          courseName,
          studentEmail: data.studentEmail,
          studentFullname: data.studentFullname
        },
        from: '"ClassroomIO" <notify@mail.classroomio.com>'
      });
    } catch (emailError) {
      console.error('Failed to send teacher buy request email:', emailError);
      // Don't fail the request if email fails
    }

    // Send email to student with payment instructions
    try {
      await sendEmail('studentProvePayment', {
        to: data.studentEmail,
        fields: {
          courseName,
          teacherEmail,
          studentFullname: data.studentFullname,
          orgName
        },
        from: `"${orgName} - ClassroomIO" <notify@mail.classroomio.com>`,
        replyTo: teacherEmail
      });
    } catch (emailError) {
      console.error('Failed to send student payment proof email:', emailError);
      // Don't fail the request if email fails
    }

    return {
      success: true,
      courseName,
      teacherEmail
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create payment request',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
