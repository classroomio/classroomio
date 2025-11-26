import * as z from 'zod';

export const ForgotPasswordSchema = z.object({
    email: z.email(),
});

export type TForgotPassword = z.infer<typeof ForgotPasswordSchema>;