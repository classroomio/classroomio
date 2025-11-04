<script lang="ts">
  import * as Sidebar from '$src/base/sidebar';
  import { page } from '$app/state';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';
  import { isQuizPage } from '$lib/utils/functions/app';
  import OrgSideBar from '$lib/components/Org/SideBar.svelte';
  import VerifyEmailModal from '$lib/components/Org/VerifyEmail/VerifyEmailModal.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';

  let { data, children } = $props();

  function redirect(siteName: string) {
    const newUrl = page.url.pathname.replace('*', siteName);
    goto(newUrl + page.url.search);
  }

  $effect(() => {
    data.orgName === '*' && redirect($currentOrg.siteName);
  });
</script>

<AddOrgModal />

<VerifyEmailModal />

<Sidebar.Provider>
  <div class="org-root flex w-full items-center justify-between">
    <div class="org-slot flex w-full items-start bg-white dark:bg-black">
      {#if !isQuizPage(page.url?.pathname)}
        <OrgSideBar />
      {/if}

      {#if data.orgName === '*'}
        <Box>Taking you to your organization...</Box>
      {:else}
        {@render children?.()}
      {/if}
    </div>
  </div>
</Sidebar.Provider>
