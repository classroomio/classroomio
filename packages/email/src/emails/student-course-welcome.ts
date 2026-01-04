import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentCourseWelcomeEmail = defineEmail({
  id: 'studentCourseWelcome',
  subject: 'Welcome to Class 🎉',
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>Congratulations 🎉, you've successfully joined: <strong>${fields.courseName}</strong></p>
      <p>Everything has been set up for you to have an amazing learning experience.</p>
      <p>If you run into any issues, don't fail to reach out to your instructor(s).</p>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content);
  }
});
