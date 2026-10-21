import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const studentProvePaymentEmail = defineEmail({
  id: 'studentProvePayment',
  subject: (fields, context) => renderStudentEmailSubject('studentProvePayment', fields, context),
  schema: z.object({
    courseName: z.string().min(1),
    teacherEmail: z.email(),
    studentFullname: z.string().min(1),
    orgName: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'studentProvePayment',
      values: {
        org_name: fields.orgName,
        course_name: fields.courseName,
        student_name: fields.studentFullname,
        teacher_email: fields.teacherEmail
      },
      branding: fields.branding,
      context
    })
});
