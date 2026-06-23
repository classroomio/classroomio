import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const inviteTeacherEmail = defineEmail({
  id: 'inviteTeacher',
  subject: 'Join us on ClassroomIO 😃',
  schema: z.object({
    email: z.string().email(),
    orgName: z.string().min(1),
    orgSiteName: z.string().min(1),
    roleName: z.string().min(1),
    expiresAt: z.string().min(1),
    inviteLink: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hey there,</p>
      <p>You have been invited to join ${fields.orgName} on ClassroomIO as ${fields.roleName} 🎉🎉🎉.</p>
      <p>This invite expires on ${fields.expiresAt} (UTC).</p>
      <div>
        <a class="button" href="${fields.inviteLink}">Accept Invitation</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
