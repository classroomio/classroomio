import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const paymentSuccessTeacherEmail = defineEmail({
  id: 'paymentSuccessTeacher',
  subject: 'New Course Sale! 💰',
  schema: z.object({
    courseName: z.string().min(1),
    studentName: z.string().min(1),
    studentEmail: z.string().email(),
    amount: z.string().min(1),
    currency: z.string().min(1),
    netAmount: z.string().min(1),
    transactionId: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi there! 👋</p>
      
      <p>Great news! You just made a sale on your course. 🎉</p>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #15803d;">Sale Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Course:</td>
            <td style="padding: 8px 0; font-weight: 600;">${fields.courseName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount:</td>
            <td style="padding: 8px 0; font-weight: 600;">${fields.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Your Earnings:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #15803d;">${fields.netAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Transaction ID:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${fields.transactionId}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">New Student</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Name:</td>
            <td style="padding: 8px 0; font-weight: 600;">${fields.studentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Email:</td>
            <td style="padding: 8px 0;">${fields.studentEmail}</td>
          </tr>
        </table>
      </div>
      
      <p>The student has been automatically enrolled in your course and can now access all the materials.</p>
      
      <p>Your earnings will be transferred to your connected payout account according to your payout schedule.</p>
      
      <p>Keep up the great work! 🚀</p>
      
      <p>Best regards,<br/>The ClassroomIO Team</p>
    `;

    return getDefaultTemplate(content);
  }
});
