import * as z from 'zod';

export const ResetPasswordSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    token: z.string(),
});

export type TResetPassword = z.infer<typeof ResetPasswordSchema>;
