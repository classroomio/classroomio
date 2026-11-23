import * as z from 'zod';

import { PASSWORD_MIN_LENGTH } from '../../constants/password';

export const ZPassword = z.string().min(PASSWORD_MIN_LENGTH, {
  message: 'validations.auth.password.min_char'
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
