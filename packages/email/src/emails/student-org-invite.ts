import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';
import { escapeHtml } from '../utils/functions/email-helpers';

export const studentOrgInviteEmail = defineEmail({
  id: 'studentOrgInvite',
  subject: (fields, context) => renderStudentEmailSubject('studentOrgInvite', fields, context),
  schema: z.object({
    email: z.string().email(),
    orgName: z.string().min(1),
    inviteLink: z.url(),
    expiresAt: z.string().min(1),
    courseNames: z.string().optional(),
    branding: ZEmailBranding
  }),
  render: (fields, context) => {
    const courseLine = fields.courseNames ? `<p><strong>${escapeHtml(fields.courseNames)}</strong></p>` : '';

    return renderStudentEmail({
      id: 'studentOrgInvite',
      values: { org_name: fields.orgName, expires_at: fields.expiresAt },
      trustedHtml: { course_names: courseLine },
      actionUrl: fields.inviteLink,
      branding: fields.branding,
      context
    });
  }
});
