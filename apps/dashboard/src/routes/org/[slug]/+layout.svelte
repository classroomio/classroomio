<script>
  import { page } from '$app/stores';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';
  import { isQuizPage } from '$lib/utils/functions/app';
  import OrgSideBar from '$lib/components/Org/SideBar.svelte';
  import VerifyEmailModal from '$lib/components/Org/VerifyEmail/VerifyEmailModal.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';

  export let data;

  let ref = null;

  $: if ($currentOrg.id && data.orgName === '*') {
    const newUrl = $page.url.pathname.replace('*', $currentOrg.siteName);
    goto(newUrl + $page.url.search);
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
