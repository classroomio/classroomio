<script>
  import { goto } from '@sapper/app';
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '../../Form/TextField.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import UploadImage from '../../UploadImage/index.svelte';
  import { supabase } from '../../../utils/functions/supabase';
  import { snackbarStore } from '../../Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../Snackbar/constants';
  import { currentOrg } from '../../../utils/store/org';
  import SectionTitle from '../SectionTitle.svelte';

  let avatar;
  let loading = false;

  async function handleUpdate() {
    try {
      loading = true;

      const updates = {
        name: $currentOrg.name,
      };

      if (avatar) {
        const filename = `user/${$currentOrg.name + Date.now()}.webp`;

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
          $currentOrg.avatar_url = publicURL;
        }
        avatar = undefined;
      }

      let { error } = await supabase
        .from('organization')
        .update(updates, {
          returning: 'minimal', // Don't return the value after inserting
        })
        .match({ id: $currentOrg.id });

      currentOrg.update((_currentOrg) => ({
        ..._currentOrg,
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

  function gotoSetting(pathname) {
    goto(`/org/${$currentOrg.siteName}/settings${pathname}`);
  }
</script>

<Grid class="border rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border border-t-0 border-l-0 border-r-0 border-gray-300">
    <Column sm={2} md={2} lg={4}
      ><SectionTitle>Organization Profile</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      <TextField
        label="Organization Name"
        bind:value={$currentOrg.name}
        className="w-60 mb-5"
      />
      <UploadImage
        bind:avatar
        src={$currentOrg.avatar_url}
        shape="rounded-md"
        widthHeight="w-24 h-24"
      />
      <PrimaryButton
        label="Update Organization"
        className="px-6 py-3 mr-5 mt-5"
        isLoading={loading}
        isDisabled={loading}
        onClick={handleUpdate}
      />
    </Column>
  </Row>
  <!-- <Row class="py-7 border border-t-0 border-l-0 border-r-0 border-gray-300">
    <Column sm={2} md={2} lg={4}><SectionTitle>Theme</SectionTitle></Column>
    <Column sm={2} md={6} lg={8}>
      <h4 class="dark:text-white">Set your brand</h4>
    </Column>
  </Row> -->
  <Row class="py-7 border border-t-0 border-l-0 border-r-0 border-gray-300">
    <Column sm={2} md={2} lg={4}
      ><SectionTitle>Custom Domain</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      <h4 class="dark:text-white">Customise your Domain</h4>
      <p class="text-sm text-gray-500 dark:text-gray-200">
        Create a custom URL so your audience can get to your organization easily
      </p>
      <PrimaryButton
        label="Edit domain"
        className="my-7 py-5 px-10 text-blue-700"
        variant={VARIANTS.OUTLINED}
        onClick={() => gotoSetting('/domains')}
      />
    </Column>
  </Row>
  <Row class="py-7 border border-t-0 border-l-0 border-r-0 border-gray-300">
    <Column sm={2} md={2} lg={4}><SectionTitle>Team</SectionTitle></Column>
    <Column sm={2} md={6} lg={8}>
      <h4 class="dark:text-white">Set up your website</h4>
      <p class="text-sm text-gray-500 dark:text-gray-200">
        Add team mates to your organization so you can both collaborate on
        projects.
      </p>
      <PrimaryButton
        label="Manage Team"
        className="my-7 py-5 px-10 text-blue-700"
        variant={VARIANTS.OUTLINED}
        onClick={() => gotoSetting('/teams')}
      />
    </Column>
  </Row>
</Grid>
