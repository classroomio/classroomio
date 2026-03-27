import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentOrgInviteEmail = defineEmail({
  id: 'studentOrgInvite',
  subject: 'You have been invited to join as a student',
  schema: z.object({
    email: z.string().email(),
    orgName: z.string().min(1),
    inviteLink: z.url(),
    expiresAt: z.string().min(1),
    courseNames: z.string().optional()
  }),
  render: (fields) => {
    const courseLine = fields.courseNames
      ? `<p>You have been given access to: <strong>${fields.courseNames}</strong>.</p>`
      : '';

    const content = `
      <p>Hi there,</p>
      <p>You have been invited to join <strong>${fields.orgName}</strong> as a student.</p>
      ${courseLine}
      <p>This invite expires on ${fields.expiresAt} (UTC).</p>
      <div>
        <a class="button" href="${fields.inviteLink}">Accept Invitation</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
