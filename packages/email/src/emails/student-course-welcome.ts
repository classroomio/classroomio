import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentCourseWelcomeEmail = defineEmail({
  id: 'studentCourseWelcome',
  subject: 'You have access to a course — sign in to get started',
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    loginUrl: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>You now have access to <strong>${fields.courseName}</strong> in <strong>${fields.orgName}</strong>.</p>
      <p><a href="${fields.loginUrl}">Sign in to ClassroomIO</a> to open the course and get started.</p>
      <p>If you run into any issues, reach out to your instructor(s).</p>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content);
  }
});
