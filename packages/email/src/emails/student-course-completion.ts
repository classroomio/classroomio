import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const studentCourseCompletionEmail = defineEmail({
  id: 'studentCourseCompletion',
  subject: (fields, context) => renderStudentEmailSubject('studentCourseCompletion', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    studentName: z.string().min(1),
    certificateUrl: z.string().url(),
    customMessage: z.string().nullable().optional(),
    branding: ZEmailBranding
  }),
  render: (fields, context) => {
    const customBlock =
      fields.customMessage && fields.customMessage.trim().length > 0
        ? `<div style="margin:16px 0;padding:12px;border-left:3px solid #6366f1;background:#f8fafc;">${fields.customMessage}</div>`
        : '';

    return renderStudentEmail({
      id: 'studentCourseCompletion',
      values: { org_name: fields.orgName, course_name: fields.courseName, student_name: fields.studentName },
      trustedHtml: { course_message: customBlock },
      actionUrl: fields.certificateUrl,
      branding: fields.branding,
      context
    });
  }
});
