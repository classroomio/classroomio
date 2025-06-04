<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { currentOrg } from '$lib/utils/store/org';

  import Box from '$lib/components/Box/index.svelte';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';
  import OrgSidebar from '$lib/components/Org/Sidebar.svelte';
  import VerifyEmailModal from '$lib/components/Org/VerifyEmail/VerifyEmailModal.svelte';
  import { isQuizPage } from '$lib/utils/functions/app';

  export let data;

  let ref = null;

  $: if ($currentOrg.id && data.orgName === '*') {
    const newUrl = $page.url.pathname.replace('*', $currentOrg.siteName);
    goto(newUrl + $page.url.search);
  }
</script>

<AddOrgModal />

<VerifyEmailModal />

<div class="org-root flex w-full items-center justify-between">
  {#if !isQuizPage($page.url?.pathname)}
    <OrgSidebar />
  {/if}
  <div class="org-slot w-full bg-white dark:bg-black">
    {#if data.orgName === '*'}
      <Box>Taking you to your organization...</Box>
    {:else}
      <slot />
    {/if}
  </div>
</div>
