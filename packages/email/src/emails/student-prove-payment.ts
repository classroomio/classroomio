import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentProvePaymentEmail = defineEmail({
  id: 'studentProvePayment',
  subject: 'One more step left',
  schema: z.object({
    courseName: z.string().min(1),
    teacherEmail: z.email(),
    studentFullname: z.string().min(1),
    orgName: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi ${fields.studentFullname},</p>
      <p>You are one step closer to joining: <strong>${fields.courseName}</strong></p>
      <p>Please send your proof of payment to: <strong>${fields.teacherEmail}</strong>, in order to join the course.</p>
      <p>Talk to you soon and see you in class.</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content);
  }
});
