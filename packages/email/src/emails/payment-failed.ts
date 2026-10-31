import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const paymentFailedEmail = defineEmail({
  id: 'paymentFailed',
  subject: 'Action needed: your ClassroomIO payment failed',
  schema: z.object({
    orgName: z.string().min(1),
    blockDate: z.string().min(1),
    billingUrl: z.url()
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>We couldn't collect the latest payment for <strong>${fields.orgName}</strong>. We'll keep retrying, but if the payment is still unpaid on <strong>${fields.blockDate}</strong>, new students won't be able to enrol, accept invites, or be added until it's resolved.</p>
      <p>Update your payment method to fix this right away. Your current students keep full access in the meantime.</p>
      <div>
        <a class="button" href="${fields.billingUrl}">Update payment method</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
