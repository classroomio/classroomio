import * as z from 'zod';
import { ZPassword } from '@cio/utils/validation/auth/password';

export const ZForgotPasswordForm = z.object({
  email: z.email()
});
export type TForgotPasswordForm = z.infer<typeof ZForgotPasswordForm>;

export const ZResetPasswordForm = z.object({
  password: ZPassword,
  confirmPassword: ZPassword,
  token: z.string()
});
export type TResetPasswordForm = z.infer<typeof ZResetPasswordForm>;
