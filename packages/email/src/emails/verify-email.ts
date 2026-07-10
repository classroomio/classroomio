import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const verifyEmailEmail = defineEmail({
  id: 'verifyEmail',
  subject: 'Action Required: Confirm your email',
  schema: z.object({
    link: z.url(),
    newEmail: z.email().optional(),
    userName: z.string().optional(),
    orgName: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const isEmailChange = !!fields.newEmail;
    const userName = fields.userName || 'there';
    const orgName = fields.orgName;

    const content = isEmailChange
      ? `
    <p><strong>Hey ${userName} 👋</strong></p>
    <p>You have requested to change your email address to <strong>${fields.newEmail}</strong>.</p>
    <p>To approve this change, please click the button below:</p>
    <div>
      <a class="button" href="${fields.link}">Approve Email Change</a>
    </div>
    <p>If you did not request this change, please ignore this email.</p>
  `
      : `
    <p><strong>Hey ${userName} 👋</strong></p>
    <p>Welcome to ${orgName}! In order to get your account ready for usage, we need to verify your email.</p>
    <p>We do this to make sure we don't get fake user emails in our signup. To get the best out of our product, we'll need you to verify your email by clicking the <strong>Verify</strong> button below.</p>
    <div>
      <a class="button" href="${fields.link}">Verify</a>
    </div>
  `;

    return getDefaultTemplate(content, fields.branding);
  }
});
