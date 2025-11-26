<script lang="ts">
<<<<<<< HEAD
  import { LOCALE } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { supabase } from '$lib/utils/functions/supabase';
  import type { ProfileStore } from '$lib/utils/store/user';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { updateProfileValidation } from '$lib/utils/functions/validator';
  import { handleLocaleChange, t } from '$lib/utils/functions/translations';

  import Grid from './Layout/Grid.svelte';
  import Row from './Layout/Row.svelte';
  import Column from './Layout/Column.svelte';
  import SectionTitle from '../SectionTitle.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import generateUUID from '$lib/utils/functions/generateUUID';
=======
  import type { TLocale } from '@cio/db/types';
  import { profile } from '$lib/utils/store/user';
  import { CircleCheckBig } from '@lucide/svelte';
  import { profileApi } from '$lib/features/auth/api/profile.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import { Row, Grid, Column } from './Layout';

  import SectionTitle from '../SectionTitle.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
>>>>>>> feat/release-v2
  import TextField from '$lib/components/Form/TextField.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';

  let avatar = $state<string | File | undefined>();
  let hasLangChanged = $state(false);
  let locale = $derived<TLocale | undefined>($profile.locale || undefined);
  let hasUnsavedChanges = $state(false);
  let email = $derived($profile.email || '');
  let isChangingEmail = $state(false);
  let emailChangeInitiated = $state(false);

  async function handleUpdate() {
    await profileApi.submit(
      {
        fullname: $profile.fullname,
        username: $profile.username,
        locale,
        avatar
      },
      $profile,
      hasLangChanged,
      locale
    );

    if (profileApi.success) {
      hasUnsavedChanges = false;
      avatar = undefined;
    }
  }

  async function handleEmailChange() {
    if (email === $profile.email) {
      return;
    }

    await profileApi.changeEmail({
      newEmail: email,
      callbackURL: window.location.href
    });

    if (profileApi.success) {
      isChangingEmail = false;
      emailChangeInitiated = true;
      // Reset email field to current email after successful change request
      email = $profile.email || '';
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Grid class="mt-0 w-full md:mt-5">
  <Row class="border-bottom-c flex flex-col items-center lg:flex-row lg:items-start lg:py-7 ">
    <Column sm={4} md={8} lg={4} class="mt-2 md:mt-0">
      <SectionTitle>{$t('settings.profile.profile_picture.heading')}</SectionTitle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-2 lg:mt-0">
      <UploadImage
        bind:avatar
        src={$profile.avatarUrl}
        widthHeight="w-16 h-16 lg:w-24 lg:h-24"
        isDisabled={profileApi.isLoading}
        change={() => (hasUnsavedChanges = true)}
      />
    </Column>
  </Row>
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('settings.profile.personal_information.heading')}</SectionTitle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-2 lg:mt-0">
      <TextField
        label={$t('settings.profile.personal_information.full_name')}
        bind:value={$profile.fullname}
        className="w-full lg:w-60 mb-4"
        errorMessage={profileApi.errors.fullname ? $t(profileApi.errors.fullname) : undefined}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.profile.personal_information.username')}
        bind:value={$profile.username}
        className="w-full lg:w-60 mb-4"
        errorMessage={profileApi.errors.username ? $t(profileApi.errors.username) : undefined}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <div class="mb-4 w-full lg:w-60">
        <TextField
          label={$t('settings.profile.personal_information.email')}
          bind:value={email}
          className="w-full"
          type="email"
          isDisabled={profileApi.isLoading}
          errorMessage={profileApi.errors.newEmail ? $t(profileApi.errors.newEmail) : undefined}
          onChange={() => {
            if (email !== $profile.email) {
              isChangingEmail = true;
              emailChangeInitiated = false;
            }
          }}
        />
        {#if isChangingEmail && email !== $profile.email}
          <div class="mt-2 flex gap-2">
            <PrimaryButton
              label={$t('settings.profile.personal_information.confirm')}
              variant={VARIANTS.CONTAINED_DARK}
              className="text-sm"
              isLoading={profileApi.isLoading}
              isDisabled={profileApi.isLoading}
              onClick={handleEmailChange}
            />
            <PrimaryButton
              label={$t('settings.profile.personal_information.cancel')}
              variant={VARIANTS.NONE}
              className="text-sm text-primary-700"
              isDisabled={profileApi.isLoading}
              onClick={() => {
                email = $profile.email || '';
                isChangingEmail = false;
                emailChangeInitiated = false;
                profileApi.errors.newEmail = '';
              }}
            />
          </div>
        {/if}
        {#if emailChangeInitiated}
          <div
            class="ml-2 mt-2 flex w-4/5 items-center gap-2 rounded-md border border-gray-200 p-2 text-sm text-amber-500"
          >
            <CircleCheckBig />
            <p>{$t('settings.profile.personal_information.email_change_verification_note')}</p>
          </div>
        {/if}
      </div>
      <LanguagePicker
        change={() => (hasUnsavedChanges = true)}
        bind:hasLangChanged
        bind:value={locale}
        className="w-full lg:w-60 mb-4"
      />
    </Column>
  </Row>

  <div class="m-5 flex w-full items-center gap-2 lg:justify-center">
    <PrimaryButton
      label={$t('settings.profile.update_profile')}
      variant={VARIANTS.CONTAINED_DARK}
      className="mr-5 w-fit"
<<<<<<< HEAD
      isLoading={loading}
      isDisabled={loading}
=======
      isLoading={profileApi.isLoading}
>>>>>>> feat/release-v2
      onClick={handleUpdate}
    />
  </div>
</Grid>
