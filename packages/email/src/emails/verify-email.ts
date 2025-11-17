import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const verifyEmailEmail = defineEmail({
  id: 'verifyEmail',
  subject: 'Action Required: Confirm your email',
  schema: z.object({
    link: z.url()
  }),
  render: (fields) => {
    const content = `
    <p><strong>Hey there 👋</strong></p>
    <p>Welcome to ClassroomIO, new friend! In order to get your account ready for usage, we need to verify your email. </p>
    <p>We do this to make sure we don't get fake user emails in our signup. To get the best out of our product, we'll need you to verify your email by clicking the <strong>Verify</strong> button below
    </p>
    <div>
      <a class="button" href="${fields.link}">Verify</a>
    </div>
  `;

    return getDefaultTemplate(content);
  }
});
