<script>
  import { goto } from '$app/navigation';
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$lib/components/Snackbar/store';

  let avatar;
  let loading = false;

  async function logout() {
    const { error } = await supabase.auth.signOut();
    goto('/login');
  }

  async function handleUpdate() {
    try {
      loading = true;

      const updates = {
        fullname: $profile.fullname,
        username: $profile.username
      };

      if (avatar) {
        const filename = `user/${$profile.username + Date.now()}.webp`;

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

      if (error) throw error;
    } catch (error) {
      let message = error.message;
      if (message.includes('profile_username_key')) {
        message = 'username already exists';
      }

      snackbar.error(`Update failed: ${message}`);
      loading = false;
    } finally {
      loading = false;
    }
  }
</script>

<Grid class="border-c rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4}>
      <p class="dark:text-white font-bold">Profile Picture</p>
    </Column>
    <Column sm={2} md={6} lg={8}>
      <UploadImage bind:avatar src={$profile.avatar_url} widthHeight="w-24 h-24" />
    </Column>
  </Row>
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4}>
      <p class="dark:text-white font-bold">Personal Information</p>
    </Column>
    <Column sm={2} md={6} lg={8}>
      <TextField label="Full Name" bind:value={$profile.fullname} className="w-60 mb-4" />
      <TextField label="Username" bind:value={$profile.username} className="w-60 mb-4" />
      <TextField label="Email" bind:value={$profile.email} className="w-60 mb-4" />
    </Column>
  </Row>
  <Row class="m-5 w-full flex items-center justify-center">
    <PrimaryButton
      label="Update Profile"
      className="mr-5"
      isLoading={loading}
      isDisabled={loading}
      onClick={handleUpdate}
    />
    <PrimaryButton variant={VARIANTS.OUTLINED} label="Log out" onClick={logout} />
  </Row>
</Grid>
