import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const teacherCourseWelcomeEmail = defineEmail({
  id: 'teacherCourseWelcome',
  subject: 'You have been invited to a course!',
  schema: z.object({
    name: z.string().min(1),
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    inviteLink: z.url()
  }),
  render: (fields) => {
    const content = `
      <p>Hey ${fields.name},</p>
      <p>You have been given access to teach a course by ${fields.orgName}</p>
      <p>The course is titled: ${fields.courseName}</p>
      <div>
        <a class="button" href="${fields.inviteLink}">Open Dashboard</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
