<script lang="ts">
  import { page } from '$app/state';
  import type { TLocale } from '@cio/db/types';
  import { profile } from '$lib/utils/store/user';
  import { CircleCheckBig } from '@lucide/svelte';
  import { profileApi } from '$lib/features/auth/api/profile.svelte';
  import { t } from '$lib/utils/functions/translations';
  import LanguagePicker from '../components/language-picker.svelte';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import * as Field from '@cio/ui/base/field';

  let avatar = $state<string | File | undefined>();
  let hasLangChanged = $state(false);
  let locale = $derived<TLocale | undefined>($profile.locale || undefined);
  let hasUnsavedChanges = $state(false);
  let email = $derived($profile.email || '');
  let isChangingEmail = $state(false);
  let emailChangeInitiated = $state(false);

  export async function handleUpdate() {
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
    const url = new URL(window.location.href);
    url.searchParams.set('trigger', 'app');

    await profileApi.changeEmail({
      newEmail: email,
      callbackURL: url.toString()
    });

    if (profileApi.success) {
      isChangingEmail = false;
      emailChangeInitiated = true;
      // Reset email field to current email after successful change request
      email = $profile.email || '';
    }
  }

  const isVerificationSent = $derived(page.url.searchParams.get('trigger') === 'app');
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>{$t('settings.profile.profile_picture.heading')}</Field.Legend>
    <Field.Field>
      <UploadImage
        bind:avatar
        src={$profile.avatarUrl}
        widthHeight="w-16 h-16 lg:w-24 lg:h-24"
        isDisabled={profileApi.isLoading}
        change={() => (hasUnsavedChanges = true)}
      />
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.profile.personal_information.heading')}</Field.Legend>

    {#if isVerificationSent}
      <div class="flex items-center gap-2 rounded-md border border-gray-200 p-2 text-green-500">
        <CircleCheckBig class="size-8" />
        <p class="text-sm">{$t('settings.profile.personal_information.email_change_verification_sent')}</p>
      </div>
    {/if}

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.profile.personal_information.full_name')}</Field.Label>
        <Input bind:value={$profile.fullname} class="" oninput={() => (hasUnsavedChanges = true)} />
        {#if profileApi.errors.fullname}
          <Field.Error>{$t(profileApi.errors.fullname)}</Field.Error>
        {/if}
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.profile.personal_information.username')}</Field.Label>
        <Input bind:value={$profile.username} oninput={() => (hasUnsavedChanges = true)} />
        {#if profileApi.errors.username}
          <Field.Error>{$t(profileApi.errors.username)}</Field.Error>
        {/if}
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.profile.personal_information.email')}</Field.Label>
        <Input
          bind:value={email}
          class="w-full"
          type="email"
          disabled={profileApi.isLoading}
          oninput={() => {
            if (email !== $profile.email) {
              isChangingEmail = true;
              emailChangeInitiated = false;
            }
          }}
        />
        {#if profileApi.errors.newEmail}
          <Field.Error>{$t(profileApi.errors.newEmail)}</Field.Error>
        {/if}
        {#if isChangingEmail && email !== $profile.email}
          <div class="mt-2 flex gap-2">
            <Button
              variant="default"
              class="text-sm"
              loading={profileApi.isLoading}
              disabled={profileApi.isLoading}
              onclick={handleEmailChange}
            >
              {$t('settings.profile.personal_information.confirm')}
            </Button>
            <Button
              variant="ghost"
              class="text-primary-700 text-sm"
              disabled={profileApi.isLoading}
              onclick={() => {
                email = $profile.email || '';
                isChangingEmail = false;
                emailChangeInitiated = false;
                profileApi.errors.newEmail = '';
              }}
            >
              {$t('settings.profile.personal_information.cancel')}
            </Button>
          </div>
        {/if}
        {#if emailChangeInitiated}
          <div class="mt-2 flex items-center gap-2 rounded-md border border-gray-200 p-2 text-amber-500">
            <CircleCheckBig class="size-8" />
            <p class="text-sm">{$t('settings.profile.personal_information.email_change_verification_note')}</p>
          </div>
        {/if}
      </Field.Field>
      <Field.Field>
        <LanguagePicker
          change={() => (hasUnsavedChanges = true)}
          bind:hasLangChanged
          bind:value={locale}
          className=""
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>
</Field.Group>
