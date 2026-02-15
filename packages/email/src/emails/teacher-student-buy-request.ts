import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const teacherStudentBuyRequestEmail = defineEmail({
  id: 'teacherStudentBuyRequest',
  subject: 'Request to Join Course!',
  schema: z.object({
    courseName: z.string().min(1),
    studentEmail: z.string().email(),
    studentFullname: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi amazing tutor,</p>
      <p>A new student has requested to join a course you are teaching: "${fields.courseName}"</p>
      <p style="font-weight: bold;">Student details</p>
      <p>
        Name: ${fields.studentFullname}<br />
        Email: ${fields.studentEmail}
      </p>
    `;

    return getDefaultTemplate(content);
  }
});
