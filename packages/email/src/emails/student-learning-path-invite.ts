import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const studentLearningPathInviteEmail = defineEmail({
  id: 'studentLearningPathInvite',
  subject: (fields) => `You've been invited to ${fields.learningPathName}`,
  schema: z.object({
    email: z.string().email(),
    orgName: z.string().min(1),
    learningPathName: z.string().min(1),
    inviteLink: z.url(),
    expiresAt: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>You have been invited to join the <strong>${fields.learningPathName}</strong> learning path in <strong>${fields.orgName}</strong> as a student.</p>
      <p>Accept the invitation to create your account — you will be enrolled in the learning path and its courses automatically.</p>
      <p>This invite expires on ${fields.expiresAt} (UTC).</p>
      <div>
        <a class="button" href="${fields.inviteLink}">Accept Invitation</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
