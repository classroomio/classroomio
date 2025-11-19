import { z } from 'zod';

export const ZUpdateProfile = z.object({
  fullname: z.string().min(5).optional(),
  username: z.string().min(5).optional(),
  locale: z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']).optional(),
  avatarUrl: z.url().optional()
});

export type TUpdateProfile = z.infer<typeof ZUpdateProfile>;

// Form validation schema - requires fullname and username
export const ZProfileUpdateForm = ZUpdateProfile.extend({
  fullname: z.string().min(5),
  username: z.string().min(1)
});

export type TProfileUpdateForm = z.infer<typeof ZProfileUpdateForm>;

// Email change validation schema
export const ZChangeEmail = z.object({
  newEmail: z.email()
});

export type TChangeEmail = z.infer<typeof ZChangeEmail>;
