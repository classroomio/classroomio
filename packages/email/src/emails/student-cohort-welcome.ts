import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const studentCohortWelcomeEmail = defineEmail({
  id: 'studentCohortWelcome',
  subject: 'You have access to a cohort — sign in to get started',
  schema: z.object({
    orgName: z.string().min(1),
    cohortName: z.string().min(1),
    loginUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>You now have access to <strong>${fields.cohortName}</strong> in <strong>${fields.orgName}</strong>.</p>
      <p><a href="${fields.loginUrl}">Sign in to the LMS</a> to open the cohort and start learning.</p>
      <p>If you run into any issues, reach out to your instructor(s).</p>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
