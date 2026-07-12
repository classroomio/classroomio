import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const studentCourseWelcomeEmail = defineEmail({
  id: 'studentCourseWelcome',
  subject: (fields) => `You have access to ${fields.courseName} — sign in to get started`,
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    loginUrl: z.string().min(1),
    customMessage: z.string().optional(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const hasCustomMessage = !!fields.customMessage && fields.customMessage.trim().length > 0;

    const intro = hasCustomMessage
      ? fields.customMessage
      : `
      <p>Hi there,</p>
      <p>You now have access to <strong>${fields.courseName}</strong> in <strong>${fields.orgName}</strong>.</p>
      <p>If you run into any issues, reach out to your instructor(s).</p>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    const content = `
      ${intro}
      <p><a href="${fields.loginUrl}">Sign in to the LMS</a> to open the course and start learning.</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
