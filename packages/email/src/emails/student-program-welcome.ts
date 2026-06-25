import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const studentProgramWelcomeEmail = defineEmail({
  id: 'studentProgramWelcome',
  subject: 'You have access to a program — sign in to get started',
  schema: z.object({
    orgName: z.string().min(1),
    programName: z.string().min(1),
    loginUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>You now have access to <strong>${fields.programName}</strong> in <strong>${fields.orgName}</strong>.</p>
      <p><a href="${fields.loginUrl}">Sign in to the LMS</a> to open the program and start learning.</p>
      <p>If you run into any issues, reach out to your instructor(s).</p>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
