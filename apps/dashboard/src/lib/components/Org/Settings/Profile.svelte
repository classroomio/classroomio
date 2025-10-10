<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import generateUUID from '$lib/utils/functions/generateUUID';
  import { supabase } from '$lib/utils/functions/supabase';
  import { handleLocaleChange, t } from '$lib/utils/functions/translations';
  import { updateProfileValidation } from '$lib/utils/functions/validator';
  import { profile } from '$lib/utils/store/user';
  import { Column, Grid, Row } from 'carbon-components-svelte';
  import SectionTitle from '../SectionTitle.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import type { ProfileStore } from '$lib/utils/store/user';
  import { LOCALE } from '$lib/utils/types';

  let avatar = $state<string | undefined>();
  let loading = $state(false);
  let hasLangChanged = $state(false);
  let locale = $derived<LOCALE | undefined>($profile.locale);
  let hasUnsavedChanges = $state(false);

  let errors = $state<Record<string, string>>({});

  async function handleUpdate() {
    errors = updateProfileValidation($profile);
    if (Object.values(errors).some((error) => error)) {
      loading = false;
      return;
    }

    try {
      console.log({ hasLangChanged });
      loading = true;

      const updates: Partial<ProfileStore> = {
        fullname: $profile.fullname,
        username: $profile.username,
        email: $profile.email,
        locale
      };
      console.log('updates', updates);

      if (avatar) {
        const filename = `user/${generateUUID()}.webp`;

        const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
          cacheControl: '3600',
          upsert: false
        });
        if (data) {
          const { data: response } = await supabase.storage.from('avatars').getPublicUrl(filename);

          updates.avatar_url = response.publicUrl;
          $profile.avatar_url = response.publicUrl;
        }
        avatar = undefined;
      }

      let { error } = await supabase.from('profile').update(updates).match({ id: $profile.id });

      profile.update((_profile) => ({
        ..._profile,
        ...updates
      }));
      snackbar.success('snackbar.course_settings.success.update_successful');

      if (hasLangChanged && locale) {
        handleLocaleChange(locale);
      }

      hasUnsavedChanges = false;
      if (error) throw error;
    } catch (error) {
      let message = error instanceof Error ? error.message : error?.toString();

      if (message?.includes('profile_username_key')) {
        message = $t('snackbar.lms.error.username_exists');
      }
      snackbar.error(`${$t('snackbar.lms.error.update')} ${message}`);
      loading = false;
    } finally {
      loading = false;
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />
<Grid class="border-c mt-5 w-full rounded border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c flex flex-col items-center py-7 lg:flex-row lg:items-start ">
    <Column sm={4} md={8} lg={4} class="mt-2 md:mt-0">
      <SectionTitle>{$t('settings.profile.profile_picture.heading')}</SectionTitle>
    </Column>
    <Column sm={2} md={4} lg={8} class="mt-2 lg:mt-0">
      <UploadImage
        bind:avatar
        src={$profile.avatar_url}
        widthHeight="w-16 h-16 lg:w-24 lg:h-24"
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
        errorMessage={$t(errors.fullname)}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.profile.personal_information.username')}
        bind:value={$profile.username}
        className="w-full lg:w-60 mb-4"
        errorMessage={$t(errors.username)}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.profile.personal_information.email')}
        bind:value={$profile.email}
        className="w-full lg:w-60 mb-4"
        errorMessage={$t(errors.email)}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <LanguagePicker
        change={() => (hasUnsavedChanges = true)}
        bind:hasLangChanged
        bind:value={locale}
        className="w-full lg:w-60 mb-4"
      />
    </Column>
  </Row>

  <Row class="m-5 flex w-full items-center gap-2 lg:justify-center">
    <PrimaryButton
      label={$t('settings.profile.update_profile')}
      variant={VARIANTS.CONTAINED_DARK}
      className="mr-5"
      isLoading={loading}
      isDisabled={loading}
      onClick={handleUpdate}
    />
  </Row>
</Grid>
