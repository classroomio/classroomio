import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const teacherStudentJoinedEmail = defineEmail({
  id: 'teacherStudentJoined',
  subject: "You've got a new student 🎉!",
  schema: z.object({
    courseName: z.string().min(1),
    studentName: z.string().min(1),
    studentEmail: z.email()
  }),
  render: (fields) => {
    const content = `
      <p>Hi amazing tutor,</p>
      <p>Congratulations 🎉, a new student: <strong>${fields.studentName} (${fields.studentEmail})</strong> has joined a course you are teaching: ${fields.courseName}</p>
      <p>We hope they have a great experience learning from the best (YOU).</p>
      <p>If you run into any issues, please don't fail to reach out to us, we'd love to make your teaching experience as easy as possible.</p>
    `;

    return getDefaultTemplate(content);
  }
});
