import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const exerciseSubmissionReceivedEmail = defineEmail({
  id: 'exerciseSubmissionReceived',
  subject: 'New exercise submission received',
  schema: z.object({
    studentName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    submissionLink: z.string().url(),
    courseTitle: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hello,</p>
      <p><strong>${fields.studentName}</strong> submitted <strong>${fields.exerciseTitle}</strong> in <strong>${fields.courseTitle}</strong>.</p>
      <p>You can begin grading from your submissions board.</p>
      <div>
        <a class="button" href="${fields.submissionLink}">Open Submissions</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
