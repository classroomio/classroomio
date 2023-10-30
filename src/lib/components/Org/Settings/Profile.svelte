<script>
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import SectionTitle from '../SectionTitle.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$lib/components/Snackbar/store';
  import LogoutButton from '$lib/components/Buttons/Logout/index.svelte';

  let avatar = '';
  let loading = false;

  async function handleUpdate() {
    try {
      loading = true;

      const updates = {
        fullname: $profile.fullname,
        username: $profile.username,
        email: $profile.email
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
      snackbar.success('Update successful');

      if (error) throw error;
    } catch (error) {
      let message = error.message;
      if (message.includes('profile_username_key')) {
        message = 'username already exists';
      }
      snackbar.success(`Update failed: ${message}`);
      loading = false;
    } finally {
      loading = false;
    }
  }
</script>

<Grid class="border-c rounded border-gray-200 w-full mt-5">
  <Row class="flex flex-col lg:flex-row items-center lg:items-start py-7 border-bottom-c ">
    <Column sm={4} md={8} lg={4} class="mt-2 md:mt-0">
      <SectionTitle>Profile Picture</SectionTitle>
    </Column>
    <Column sm={2} md={4} lg={8} class="mt-2 lg:mt-0">
      <UploadImage bind:avatar src={$profile.avatar_url} widthHeight="w-16 h-16 lg:w-24 lg:h-24" />
    </Column>
  </Row>
  <Row class="flex flex-col lg:flex-row py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>Personal Information</SectionTitle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-2 lg:mt-0">
      <TextField label="Full Name" bind:value={$profile.fullname} className="w-full lg:w-60 mb-4" />
      <TextField label="Username" bind:value={$profile.username} className="w-full lg:w-60 mb-4" />
      <TextField label="Email" bind:value={$profile.email} className="w-full lg:w-60 mb-4" />
    </Column>
  </Row>
  <Row class="m-5 w-full flex items-center gap-2 lg:justify-center">
    <PrimaryButton
      label="Update Profile"
      className="mr-5"
      isLoading={loading}
      isDisabled={loading}
      onClick={handleUpdate}
    />
    <LogoutButton />
  </Row>
</Grid>
