import * as z from 'zod';

export const ZForgotPasswordForm = z.object({
  email: z.email()
});
export type TForgotPasswordForm = z.infer<typeof ZForgotPasswordForm>;

export const ZResetPasswordForm = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  token: z.string()
});
export type TResetPasswordForm = z.infer<typeof ZResetPasswordForm>;
