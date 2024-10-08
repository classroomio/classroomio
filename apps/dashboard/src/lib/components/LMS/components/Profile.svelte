<script>
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$lib/components/Snackbar/store';
  import generateUUID from '$lib/utils/functions/generateUUID';
  import { t } from '$lib/utils/functions/translations';
  import LanguagePicker from '$lib/components/Org/Settings/LanguagePicker.svelte';
  import { handleLocaleChange } from '$lib/utils/functions/translations';

  let avatar = '';
  let loading = false;
  let hasLangChanged = false;
  let locale = '';

  async function handleUpdate() {
    try {
      loading = true;

      const updates = {
        fullname: $profile.fullname,
        username: $profile.username,
        email: $profile.email,
        locale
      };

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
      snackbar.success();

      if (hasLangChanged) {
        handleLocaleChange(locale);
      }

      if (error) throw error;
    } catch (error) {
      let message = error.message;
      if (message.includes('profile_username_key')) {
        message = $t('username already exists');
      }

      snackbar.error(`snackbar.lms.error.update: ${message}`);
      loading = false;
    } finally {
      loading = false;
    }
  }

  $: locale = $profile.locale;
</script>

<Grid class="border-c rounded border-gray-200 dark:border-neutral-600 w-full mt-5">
  <Row class="flex flex-col lg:flex-row items-center lg:items-start py-7 border-bottom-c ">
    <Column sm={4} md={8} lg={4} class="mt-2 md:mt-0">
      <p class="dark:text-white font-bold">{$t('settings.profile.profile_picture.heading')}</p>
    </Column>
    <Column sm={2} md={4} lg={8} class="mt-2 lg:mt-0">
      <UploadImage bind:avatar src={$profile.avatar_url} widthHeight="w-16 h-16 lg:w-24 lg:h-24" />
    </Column>
  </Row>
  <Row class="flex flex-col lg:flex-row py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}>
      <p class="dark:text-white font-bold">{$t('settings.profile.personal_information.heading')}</p>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-2 lg:mt-0">
      <TextField
        label={$t('settings.profile.personal_information.full_name')}
        bind:value={$profile.fullname}
        className="w-full lg:w-60 mb-4"
      />
      <TextField
        label={$t('settings.profile.personal_information.username')}
        bind:value={$profile.username}
        className="w-full lg:w-60 mb-4"
      />
      <TextField
        label={$t('settings.profile.personal_information.email')}
        bind:value={$profile.email}
        className="w-full lg:w-60 mb-4"
      />

      <LanguagePicker
        bind:hasLangChanged
        bind:value={$profile.locale}
        className="w-full lg:w-60 mb-4"
      />
    </Column>
  </Row>
  <Row class="m-5 w-full flex items-center gap-2 lg:justify-center">
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
