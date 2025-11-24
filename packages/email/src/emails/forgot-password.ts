import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const forgotPasswordEmail = defineEmail({
  id: 'forgotPassword',
  subject: 'Password reset notification - ClassroomIO',
  schema: z.object({
    email: z.email(),
    name: z.string().min(1),
    link: z.url()
  }),
  render: (fields) => {
    const content = `Hello ${fields.name},
    <p>You are receiving this email because you have requested a password reset for your ClassroomIO account.</p>
    <p>Please click the button below to reset your password:</p>
    
    <div>
      <a class="button" href="${fields.link}">Reset my password</a>
    </div>

    <p>PS: If you did not initiate this request, reply to this email or write to help@classroomio.com so we can look into a possible attempt to breach your account.</p>
    `;

    return getDefaultTemplate(content);
  }
});
