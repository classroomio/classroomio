import { BaseApiWithErrors } from '$lib/utils/services/api';
import type { TForgotPasswordForm } from '../utils/types';
import { authClient } from '$lib/utils/services/auth/client';
import { forgotPasswordValidation } from '../utils/validation';
import { snackbar } from '$lib/components/Snackbar/store';

export class ForgotApi extends BaseApiWithErrors {
  async submit(fields: TForgotPasswordForm) {
    const errors = forgotPasswordValidation(fields);
    if (errors) {
      this.errors = errors;
      return;
    }

    try {
      this.isLoading = true;
      this.errors = {};
      this.success = false;

      const { error } = await authClient.requestPasswordReset({
        email: fields.email,
        redirectTo: window.location.origin + '/reset'
      });

      if (error) throw error;

      this.success = true;
    } catch (error) {
      console.error(error);
      snackbar.error('snackbar.something');
    } finally {
      this.isLoading = false;
    }
  }
}

export const forgotApi = new ForgotApi();
