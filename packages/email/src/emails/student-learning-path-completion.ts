import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const studentLearningPathCompletionEmail = defineEmail({
  id: 'studentLearningPathCompletion',
  subject: (fields) => `Congratulations! You've completed ${fields.learningPathName}`,
  schema: z.object({
    orgName: z.string().min(1),
    learningPathName: z.string().min(1),
    studentName: z.string().min(1),
    loginUrl: z.string().min(1),
    certificateAvailable: z.boolean(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const certificateBlock = fields.certificateAvailable
      ? `<p>Your certificate is ready — open the learning path to view and download it.</p>`
      : '';

    const content = `
      <p>Hi ${fields.studentName},</p>
      <p>Congratulations! You have completed <strong>${fields.learningPathName}</strong>.</p>
      ${certificateBlock}
      <p><a href="${fields.loginUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;">Open your learning path</a></p>
      <p>If the button does not work, copy and paste this link into your browser:<br/><span style="word-break:break-all;">${fields.loginUrl}</span></p>
      <p>Cheers,<br/>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
