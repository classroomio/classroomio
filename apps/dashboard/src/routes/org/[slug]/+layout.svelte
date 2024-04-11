<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';
  import { isQuizPage } from '$lib/utils/functions/app';
  import OrgSideBar from '$lib/components/Org/SideBar.svelte';
  import VerifyEmailModal from '$lib/components/Org/VerifyEmail/VerifyEmailModal.svelte';
  import { locale } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';

  let userId;
  let userLang = '';
  let defaultLang = 'en';

  // function to set the default value of the languages
  async function handleLocaleChange(newLang) {
    defaultLang = newLang;
    console.log('default Lang:', defaultLang);
    $locale = defaultLang;
    await fetch('/api/i18n', {
      body: JSON.stringify({ locale: $locale }),
      method: 'POST'
    });
  }

  // function to get user profile
  async function getUser() {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const { user: authUser } = session || {};
    console.log('Get user', authUser);

    if (authUser) {
      userId = authUser.id;
    }
  }

  // function get lang
  async function getLang() {
    await getUser();

    let { data, error } = await supabase.from('profile').select('*').eq('id', userId).single();
    if (!error) {
      console.log('data.language', data.language);

      userLang = data.language;
    }

    handleLocaleChange(userLang);
  }

  onMount(() => {
    getLang();
  });
  import Box from '$lib/components/Box/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';

  export let data;

  $: if ($currentOrg.id && data.orgName === '*') {
    goto(`/org/${$currentOrg.siteName}`);
  }
</script>

<AddOrgModal />
<VerifyEmailModal />
<div class="org-root w-full flex items-center justify-between">
  {#if !isQuizPage($page.url?.pathname)}
    <OrgSideBar />
  {/if}
  <div class="org-slot bg-white dark:bg-black w-full">
    {#if data.orgName === '*'}
      <Box>Taking you to your organization...</Box>
    {:else}
      <slot />
    {/if}
  </div>
</div>
