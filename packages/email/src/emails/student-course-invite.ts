import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const studentCourseInviteEmail = defineEmail({
  id: 'studentCourseInvite',
  subject: (fields, context) => renderStudentEmailSubject('studentCourseInvite', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    inviteLink: z.string().url(),
    expiresAt: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'studentCourseInvite',
      values: { org_name: fields.orgName, course_name: fields.courseName, expires_at: fields.expiresAt },
      actionUrl: fields.inviteLink,
      branding: fields.branding,
      context
    })
});
