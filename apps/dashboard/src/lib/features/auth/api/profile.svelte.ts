import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { TLocale, TProfile } from '@cio/db/types';
import { ZChangeEmail, ZProfileUpdateForm } from '@cio/utils/validation/account';

import type { TProfileUpdateForm as TProfileUpdateFormSchema } from '@cio/utils/validation/account';
import { authClient } from '$lib/utils/services/auth/client';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile as profileStore } from '$lib/utils/store/user';
import { snackbar } from '$lib/components/Snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { uploadImage } from '$lib/utils/services/upload';

export interface TProfileUpdateForm extends Omit<TProfileUpdateFormSchema, 'avatarUrl'> {
  avatar?: string | File | undefined;
}

export interface TChangeEmailForm {
  newEmail: string;
  callbackURL?: string;
}

export class ProfileApi extends BaseApiWithErrors {
  private validateForm(fields: TProfileUpdateForm): boolean {
    const validationData = {
      fullname: fields.fullname,
      username: fields.username,
      locale: fields.locale
    };

    const result = ZProfileUpdateForm.safeParse(validationData);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return false;
    }
    return true;
  }

  private async updateUserInfo(
    fields: TProfileUpdateForm,
    currentProfile: TProfile,
    avatarUrl?: string
  ): Promise<void> {
    const userUpdates: { name?: string; image?: string } = {};

    if (fields.fullname !== currentProfile.fullname) {
      userUpdates.name = fields.fullname;
    }
    if (avatarUrl) {
      userUpdates.image = avatarUrl;
    }

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await authClient.updateUser(userUpdates);
      if (userError) throw userError;
    }
  }

  private buildProfileUpdates(
    fields: TProfileUpdateForm,
    currentProfile: TProfile,
    locale: TLocale | undefined,
    avatarUrl?: string
  ): Partial<TProfile> {
    const profileUpdates: Partial<TProfile> = {};

    if (fields.fullname !== currentProfile.fullname) {
      profileUpdates.fullname = fields.fullname;
    }

    if (fields.username !== currentProfile.username) {
      profileUpdates.username = fields.username;
    }

    if (locale && locale !== currentProfile.locale) {
      profileUpdates.locale = locale;
    }

    if (avatarUrl) {
      profileUpdates.avatarUrl = avatarUrl;
    }

    return profileUpdates;
  }

  private async updateProfile(profileUpdates: Partial<TProfile>): Promise<void> {
    if (Object.keys(profileUpdates).length === 0) {
      return;
    }

    await this.execute<typeof classroomio.account.profile.$put>({
      requestFn: () => classroomio.account.profile.$put({ json: profileUpdates }),
      logContext: 'updating profile',
      onSuccess: (response) => {
        profileStore.update((_profile) => ({
          ..._profile,
          ...response.profile
        }));
      }
    });
  }

  private handleError(error: unknown): void {
    console.error(error);
    const message = error instanceof Error ? error.message : `${error}`;

    if (message.includes('profile_username_key')) {
      this.errors.username = t.get('snackbar.lms.error.username_exists');
      snackbar.error('snackbar.lms.error.username_exists');
    } else {
      this.errors.general = message;
      snackbar.error(`${t.get('snackbar.update_failed')}: ${message}`);
    }
  }

  async submit(fields: TProfileUpdateForm, currentProfile: TProfile, hasLangChanged: boolean, locale?: TLocale) {
    if (!this.validateForm(fields)) {
      return;
    }

    try {
      this.isLoading = true;
      this.errors = {};
      this.success = false;

      // Handle avatar upload if provided
      let avatarUrl: string | undefined;
      if (fields.avatar instanceof File) {
        avatarUrl = await uploadImage(fields.avatar);
      }

      // Update user info via Better Auth (name and image)
      await this.updateUserInfo(fields, currentProfile, avatarUrl);

      // Update profile-specific fields via API route
      const profileUpdates = this.buildProfileUpdates(fields, currentProfile, locale, avatarUrl);
      await this.updateProfile(profileUpdates);

      // Handle locale change if needed
      if (hasLangChanged && locale) {
        handleLocaleChange(locale);
      }

      snackbar.success('snackbar.course_settings.success.update_successful');
      this.success = true;
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async changeEmail(fields: TChangeEmailForm) {
    // Validate email format
    const result = ZChangeEmail.safeParse({ newEmail: fields.newEmail });
    console.log('result', result);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    try {
      this.isLoading = true;
      this.errors = {};
      this.success = false;

      const { error } = await authClient.changeEmail({
        newEmail: fields.newEmail,
        callbackURL: fields.callbackURL
      });

      if (error) throw new Error(error.message);

      snackbar.success();
      this.success = true;
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : `${error}`;

      this.errors.email = message;
      snackbar.error(`${t.get('snackbar.update_failed')}: ${message}`);
    } finally {
      this.isLoading = false;
    }
  }
}

export const profileApi = new ProfileApi();
