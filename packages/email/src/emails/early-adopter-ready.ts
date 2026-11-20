import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const earlyAdopterReadyEmail = defineEmail({
  id: 'earlyAdopterReady',
  subject: 'We received your payment. Your Early Adopter plan is ready',
  schema: z.object({
    claimUrl: z.url()
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>We received your payment. Thank you for backing ClassroomIO early.</p>
      <p>Your Early Adopter plan is ready and your rate is locked in. Use the button below to create your account and connect the plan to your academy.</p>
      <div>
        <a class="button" href="${fields.claimUrl}">Set up my academy</a>
      </div>
      <p>This link is yours and works once. If you already have an account, log in after opening it and the plan connects to the academy you open.</p>
    `;

    return getDefaultTemplate(content);
  }
});
