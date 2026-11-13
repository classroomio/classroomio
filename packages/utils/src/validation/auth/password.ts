import * as z from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt reads at most this many UTF-8 bytes; longer inputs cannot be hashed as given. */
export const PASSWORD_MAX_BYTES = 72;

export const ZPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: 'validations.auth.password.min_char'
  })
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, {
    message: 'validations.auth.password.max_bytes'
  });

export const ZPasswordFields = z
  .object({
    password: ZPassword,
    confirmPassword: ZPassword
  })
  .refine((fields) => fields.password === fields.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validations.confirm_password.not_match'
  });
