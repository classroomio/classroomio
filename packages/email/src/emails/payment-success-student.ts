import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const paymentSuccessStudentEmail = defineEmail({
  id: 'paymentSuccessStudent',
  subject: 'Payment Confirmed - Welcome to Your Course! 🎉',
  schema: z.object({
    studentName: z.string().min(1),
    courseName: z.string().min(1),
    amount: z.string().min(1),
    currency: z.string().min(1),
    orgName: z.string().min(1),
    transactionId: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi ${fields.studentName},</p>
      
      <p>Great news! Your payment has been successfully processed. 🎉</p>
      
      <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0369a1;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Course:</td>
            <td style="padding: 8px 0; font-weight: 600;">${fields.courseName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount Paid:</td>
            <td style="padding: 8px 0; font-weight: 600;">${fields.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Transaction ID:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${fields.transactionId}</td>
          </tr>
        </table>
      </div>
      
      <p>You now have full access to the course. Here's what you can do next:</p>
      
      <ul>
        <li>Log in to your account to start learning</li>
        <li>Download any course materials</li>
        <li>Participate in discussions and exercises</li>
      </ul>
      
      <p>If you have any questions or need assistance, feel free to reach out to the course instructor or our support team.</p>
      
      <p>Happy learning!</p>
      
      <p>Best regards,<br/>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content);
  }
});
