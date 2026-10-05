import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const studentCourseWelcomeEmail = defineEmail({
  id: 'studentCourseWelcome',
  subject: (fields, context) =>
    renderStudentEmailSubject('studentCourseWelcome', { course_name: fields.courseName }, context),
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    loginUrl: z.string().min(1),
    customMessage: z.string().optional(),
    branding: ZEmailBranding
  }),
  render: (fields, context) => {
    const hasCourseMessage = Boolean(fields.customMessage?.trim());
    const bodyContext = hasCourseMessage ? { ...context, contentOverride: '{{course_message}}' } : context;

    return renderStudentEmail({
      id: 'studentCourseWelcome',
      values: { org_name: fields.orgName, course_name: fields.courseName },
      trustedHtml: { course_message: fields.customMessage },
      actionUrl: fields.loginUrl,
      branding: fields.branding,
      context: bodyContext
    });
  }
});
