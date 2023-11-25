<script>
  import { goto } from '$app/navigation';
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import SectionTitle from '../SectionTitle.svelte';

  let avatar;
  let loading = false;
  const themes = {
    rose: 'theme-rose',
    green: 'theme-green',
    orange: 'theme-orange',
    violet: 'theme-violet',
    default: ''
  };

  function handleChangeTheme(t = '') {
    return async () => {
      document.body.className = document.body.className
        .split(' ')
        .filter((c) => !c.includes('theme'))
        .join(' ')
        .concat(!!t ? ' ' : '', t);
      $currentOrg.theme = t;

      const res = await supabase
        .from('organization')
        .update({ theme: t })
        .match({ id: $currentOrg.id });

      console.log('Update theme', res);
    };
  }

  async function handleUpdate() {
    try {
      loading = true;

      const updates = {
        name: $currentOrg.name
      };

      if (avatar) {
        const filename = `user/${$currentOrg.name + Date.now()}.webp`;

        const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
          cacheControl: '3600',
          upsert: false
        });

        if (data) {
          const { data: response } = supabase.storage.from('avatars').getPublicUrl(filename);

          updates.avatar_url = response.publicUrl;
          $currentOrg.avatar_url = response.publicUrl;
        }
        avatar = undefined;
      }

      let { error } = await supabase
        .from('organization')
        .update(updates)
        .match({ id: $currentOrg.id });

      currentOrg.update((_currentOrg) => ({
        ..._currentOrg,
        ...updates
      }));

      snackbar.success('Update successful');

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

  function gotoSetting(pathname) {
    goto(`${$currentOrgPath}/settings${pathname}`);
  }
</script>

<Grid class="border-c rounded border-gray-200 w-full mt-5">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}><SectionTitle>Organization Profile</SectionTitle></Column>
    <Column sm={8} md={8} lg={8} class="mt-2 lg:mt-0 flex flex-col items-center lg:items-start">
      <TextField
        label="Organization Name"
        bind:value={$currentOrg.name}
        className="w-full lg:w-60 mb-5"
      />
      <UploadImage
        bind:avatar
        src={$currentOrg.avatar_url}
        shape="rounded-md"
        widthHeight="w-24 h-24"
      />
      <PrimaryButton
        label="Update Organization"
        className="px-6 py-3 lg:mr-5 mt-5"
        isLoading={loading}
        isDisabled={loading}
        onClick={handleUpdate}
      />
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}><SectionTitle>Theme</SectionTitle></Column>
    <Column sm={8} md={8} lg={8}>
      <h4 class="dark:text-white lg:mt-0">Set your brand color</h4>

      <div class="flex gap-2">
        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.default &&
            'border-[#1d4ee2]'} mr-3 flex items-center justify-center"
          on:click={handleChangeTheme(themes.default)}
        >
          <div class="w-3 h-3 md:w-6 md:h-6 bg-[#1d4ee2] rounded-full m-1" />
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.rose &&
            'border-[#be1241]'} mr-3 flex items-center justify-center"
          on:click={handleChangeTheme(themes.rose)}
        >
          <div class="w-3 h-3 md:w-6 md:h-6 bg-[#be1241] rounded-full m-1" />
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.green &&
            'border-[#0c891b]'} mr-3 flex items-center justify-center"
          on:click={handleChangeTheme(themes.green)}
        >
          <div class="w-3 h-3 md:w-6 md:h-6 bg-[#0c891b] rounded-full m-1" />
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.orange &&
            'border-[#cc4902]'} mr-3 flex items-center justify-center"
          on:click={handleChangeTheme(themes.orange)}
        >
          <div class="w-3 h-3 md:w-6 md:h-6 bg-[#cc4902] rounded-full m-1" />
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.violet &&
            'border-[#cf00ce]'} mr-3 flex items-center justify-center"
          on:click={handleChangeTheme(themes.violet)}
        >
          <div class="w-3 h-3 md:w-6 md:h-6 bg-[#cf00ce] rounded-full m-1" />
        </button>
      </div>
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}><SectionTitle>Custom Domain</SectionTitle></Column>
    <Column sm={8} md={8} lg={8}>
      <h4 class="dark:text-white lg:mt-0">Customise your Domain</h4>
      <p class="text-sm text-gray-500 dark:text-white">
        Create a custom URL so your audience can get to your organization easily
      </p>
      <PrimaryButton
        label="Edit domain"
        className="my-7 py-5 px-10 text-primary-700"
        variant={VARIANTS.OUTLINED}
        onClick={() => gotoSetting('/domains')}
      />
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}><SectionTitle>Team</SectionTitle></Column>
    <Column sm={8} md={8} lg={8}>
      <h4 class="dark:text-white lg:mt-0">Set up your website</h4>
      <p class="text-sm text-gray-500 dark:text-white">
        Add team mates to your organization so you can both collaborate on projects.
      </p>
      <PrimaryButton
        label="Manage Team"
        className="my-7 py-5 px-10 text-primary-700"
        variant={VARIANTS.OUTLINED}
        onClick={() => gotoSetting('/teams')}
      />
    </Column>
  </Row>
</Grid>
