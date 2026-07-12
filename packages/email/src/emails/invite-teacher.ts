import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';
import { escapeHtml } from '../utils/functions/email-helpers';

export const inviteTeacherEmail = defineEmail({
  id: 'inviteTeacher',
  subject: 'You have been invited to join an organization on ClassroomIO',
  schema: z.object({
    email: z.string().email(),
    orgName: z.string().min(1),
    orgSiteName: z.string().min(1),
    roleName: z.string().min(1),
    inviterName: z.string().min(1).optional(),
    expiresAt: z.string().min(1),
    inviteLink: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const orgName = escapeHtml(fields.orgName);
    const roleName = escapeHtml(fields.roleName);
    const inviterName = fields.inviterName ? escapeHtml(fields.inviterName) : undefined;
    const inviteLink = escapeHtml(fields.inviteLink);
    const expiresAt = escapeHtml(fields.expiresAt);

    const invitationLine = inviterName
      ? `<p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on ClassroomIO as ${roleName}.</p>`
      : `<p>You have been invited to join <strong>${orgName}</strong> on ClassroomIO as ${roleName}.</p>`;

    const content = `
      <p>Hi there,</p>
      ${invitationLine}
      <p>This invite expires on ${expiresAt} (UTC).</p>
      <div>
        <a class="button" href="${inviteLink}">Accept Invitation</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
