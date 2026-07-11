import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

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
    const invitationLine = fields.inviterName
      ? `<p><strong>${fields.inviterName}</strong> invited you to join <strong>${fields.orgName}</strong> on ClassroomIO as ${fields.roleName}.</p>`
      : `<p>You have been invited to join <strong>${fields.orgName}</strong> on ClassroomIO as ${fields.roleName}.</p>`;

    const content = `
      <p>Hi there,</p>
      ${invitationLine}
      <p>This invite expires on ${fields.expiresAt} (UTC).</p>
      <div>
        <a class="button" href="${fields.inviteLink}">Accept Invitation</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
