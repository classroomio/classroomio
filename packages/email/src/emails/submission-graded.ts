import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const submissionGradedEmail = defineEmail({
  id: 'submissionGraded',
  subject: 'Your exercise submission has been updated',
  schema: z.object({
    orgName: z.string().min(1),
    studentName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    courseName: z.string().min(1),
    statusText: z.string().min(1),
    exerciseLink: z.string().min(1),
    score: z.string().optional(),
    lessonTitle: z.string().optional(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    let content = `
      <p>Hello ${fields.studentName},</p>
      <p>The status of your submitted exercise on <strong>${fields.exerciseTitle}</strong> has been updated to <strong>${fields.statusText}</strong>.</p>
    `;

    if (fields.score) {
      content += `
        <p>Your score was <strong>${fields.score}</strong>.</p>
        <div>
          <a class="button" href="${fields.exerciseLink}">View your result</a>
        </div>
      `;
    } else {
      content += `
        <div>
          <a class="button" href="${fields.exerciseLink}">Open exercise</a>
        </div>
      `;
    }

    if (fields.lessonTitle) {
      content += `
        <p>This exercise is for <strong>${fields.lessonTitle}</strong> in a course you are taking titled <strong>${fields.courseName}</strong>.</p>
      `;
    } else {
      content += `
        <p>This exercise is in a course you are taking titled <strong>${fields.courseName}</strong>.</p>
      `;
    }

    return getDefaultTemplate(content, fields.branding);
  }
});
