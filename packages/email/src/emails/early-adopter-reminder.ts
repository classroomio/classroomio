import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const earlyAdopterReminderEmail = defineEmail({
  id: 'earlyAdopterReminder',
  subject: 'Your Early Adopter plan is waiting for an academy',
  schema: z.object({
    claimUrl: z.url()
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>You paid for the Early Adopter plan a few days ago, but it is not connected to an academy yet.</p>
      <p>It takes about two minutes. Create your account, finish setting up, and your plan connects automatically.</p>
      <div>
        <a class="button" href="${fields.claimUrl}">Set up my academy</a>
      </div>
      <p>If you need a hand, reply to this email and we will help.</p>
    `;

    return getDefaultTemplate(content);
  }
});
