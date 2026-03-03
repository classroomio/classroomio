import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const submissionStatusUpdateEmail = defineEmail({
  id: 'submissionStatusUpdate',
  subject: 'Submission Update',
  schema: z.object({
    studentName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    statusText: z.string().min(1),
    exerciseLink: z.string().url(),
    courseTitle: z.string().min(1),
    lessonTitle: z.string().min(1).optional(),
    totalMark: z.number().nonnegative().optional(),
    maxMark: z.number().positive().optional()
  }),
  render: (fields) => {
    const scoreBlock =
      fields.totalMark !== undefined && fields.maxMark !== undefined
        ? `<p>Your score is <strong>${fields.totalMark}/${fields.maxMark}</strong>.</p>`
        : '';
    const lessonBlock = fields.lessonTitle
      ? `<p>This exercise belongs to <strong>${fields.lessonTitle}</strong> in <strong>${fields.courseTitle}</strong>.</p>`
      : `<p>This exercise belongs to <strong>${fields.courseTitle}</strong>.</p>`;

    const content = `
      <p>Hello ${fields.studentName},</p>
      <p>Your submission for <strong>${fields.exerciseTitle}</strong> has been updated to <strong>${fields.statusText}</strong>.</p>
      ${scoreBlock}
      ${lessonBlock}
      <div>
        <a class="button" href="${fields.exerciseLink}">Open Exercise</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
