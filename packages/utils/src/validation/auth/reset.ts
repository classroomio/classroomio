import * as z from 'zod';
import { ZPasswordFields } from './password';

export const ResetPasswordSchema = ZPasswordFields.safeExtend({
  token: z.string()
});

export type TResetPassword = z.infer<typeof ResetPasswordSchema>;
