import type { TForgotPasswordForm, TResetPasswordForm } from './types';

import { ForgotPasswordSchema } from '@cio/utils/validation/auth/forgot';
import { ResetPasswordSchema } from '@cio/utils/validation/auth/reset';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

export const forgotPasswordValidation = (field: TForgotPasswordForm) => {
  const result = ForgotPasswordSchema.safeParse(field);
  if (!result.success) {
    return mapZodErrorsToTranslations(result.error);
  }
};

export const resetPasswordValidation = (field: TResetPasswordForm) => {
  const result = ResetPasswordSchema.safeParse(field);
  if (!result.success) {
    return mapZodErrorsToTranslations(result.error);
  }
};
