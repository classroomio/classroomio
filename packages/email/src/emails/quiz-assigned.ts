import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const quizAssignedEmail = defineEmail({
  id: 'quizAssigned',
  subject: 'You have a quiz to complete',
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    quizUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>A quiz — <strong>${fields.exerciseTitle}</strong> — has been assigned to you in <strong>${fields.courseName}</strong> at <strong>${fields.orgName}</strong>.</p>
      <div>
        <a class="button" href="${fields.quizUrl}">Take the quiz</a>
      </div>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
