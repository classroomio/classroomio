import { BaseApiWithErrors } from '$lib/utils/services/api';
import type { TResetPasswordForm } from '../utils/types';
import { authClient } from '$lib/utils/services/auth/client';
import { goto } from '$app/navigation';
import { resetPasswordValidation } from '../utils/validation';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';

export class ResetApi extends BaseApiWithErrors {
  async submit(fields: TResetPasswordForm) {
    const errors = resetPasswordValidation(fields);
    if (errors) {
      this.errors = errors;
      return;
    }

    try {
      this.isLoading = true;
      this.errors = {};
      this.success = false;

      const { error } = await authClient.resetPassword({
        newPassword: fields.password, // required
        token: fields.token // required
      });

      if (error) throw new Error(error.message);

      this.success = true;
      snackbar.success();

      goto(resolve('/login', {}));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      snackbar.error(message);
    } finally {
      this.isLoading = false;
    }
  }

  setError(_errors: Record<string, string>) {
    this.errors = _errors;
  }
}

export const resetApi = new ResetApi();
