import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const submissionReceivedEmail = defineEmail({
  id: 'submissionReceived',
  subject: 'New exercise submission',
  schema: z.object({
    orgName: z.string().min(1),
    studentName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    exerciseLink: z.string().min(1),
    submissionLink: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hello,</p>
      <p>A student <strong>${fields.studentName}</strong> just submitted an exercise <a href="${fields.exerciseLink}">${fields.exerciseTitle}</a>.</p>
      <p>You can get started grading by clicking "Open Submissions".</p>
      <div>
        <a class="button" href="${fields.submissionLink}">Open Submissions</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
