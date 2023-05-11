<script>
  import { goto } from '@sapper/app';
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '../../Form/TextField.svelte';
  import SectionTitle from '../SectionTitle.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import UploadImage from '../../UploadImage/index.svelte';
  import { supabase } from '../../../utils/functions/supabase';
  import { profile } from '../../../utils/store/user';
  import { snackbarStore } from '../../Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../Snackbar/constants';

  let avatar;
  let loading = false;

  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.log('error logout', error);
    goto('/login');
  }

  async function handleUpdate() {
    try {
      loading = true;

      const updates = {
        fullname: $profile.fullname,
        username: $profile.username,
      };

      if (avatar) {
        const filename = `user/${$profile.username + Date.now()}.webp`;

        const { data } = await supabase.storage
          .from('avatars')
          .upload(filename, avatar, {
            cacheControl: '3600',
            upsert: false,
          });

        if (data && data.Key) {
          const { publicURL } = supabase.storage
            .from('avatars')
            .getPublicUrl(filename);

          updates.avatar_url = publicURL;
          $profile.avatar_url = publicURL;
        }
        avatar = undefined;
      }

      let { error } = await supabase
        .from('profile')
        .update(updates, {
          returning: 'minimal', // Don't return the value after inserting
        })
        .match({ id: $profile.id });

      profile.update((_profile) => ({
        ..._profile,
        ...updates,
      }));
      $snackbarStore.open = true;
      $snackbarStore.message = 'Update successful';
      $snackbarStore.severity = SNACKBAR_SEVERITY.SUCCESS;

      if (error) throw error;
    } catch (error) {
      let message = error.message;
      if (message.includes('profile_username_key')) {
        message = 'username already exists';
      }
      $snackbarStore.open = true;
      $snackbarStore.message = `Update failed: ${message}`;
      $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
      loading = false;
    } finally {
      loading = false;
    }
  }
</script>

<Grid class="border-c rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4}>
      <SectionTitle>Profile Picture</SectionTitle>
    </Column>
    <Column sm={2} md={6} lg={8}>
      <UploadImage
        bind:avatar
        src={$profile.avatar_url}
        widthHeight="w-24 h-24"
      />
    </Column>
  </Row>
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4}>
      <SectionTitle>Personal Information</SectionTitle>
    </Column>
    <Column sm={2} md={6} lg={8}>
      <TextField
        label="Full Name"
        bind:value={$profile.fullname}
        className="w-60 mb-4"
      />
      <TextField
        label="Username"
        bind:value={$profile.username}
        className="w-60 mb-4"
      />
      <TextField
        label="Email"
        bind:value={$profile.email}
        className="w-60 mb-4"
      />
    </Column>
  </Row>
  <Row class="m-5 w-full flex items-center justify-center">
    <PrimaryButton
      label="Update Profile"
      className="px-6 py-3 mr-5"
      isLoading={loading}
      isDisabled={loading}
      onClick={handleUpdate}
    />
    <PrimaryButton
      className="px-6 py-3"
      variant={VARIANTS.CONTAINED_DANGER}
      label="Log out"
      onClick={logout}
    />
  </Row>
</Grid>
