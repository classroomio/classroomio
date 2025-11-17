import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const onPasswordResetEmail = defineEmail({
  id: 'onPasswordReset',
  subject: 'Password Reset Successful - ClassroomIO',
  schema: z.object({
    name: z.string().min(1)
  }),
  render: (fields) => {
    return getDefaultTemplate(`Heya ${fields.name},
    <p>Your password has been reset successfully.</p>
    `);
  }
});
