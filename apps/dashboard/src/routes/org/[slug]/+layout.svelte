<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { currentOrg } from '$lib/utils/store/org';
  import { isQuizPage } from '$lib/utils/functions/app';
  import { VerifyEmailModal } from '$lib/features/onboarding/components';

  import Box from '$lib/components/Box/index.svelte';
  import { OrgSidebar } from '$lib/features/ui/sidebar/org-sidebar/index.js';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';

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

<div class="org-root flex w-full items-center justify-between">
  <div class="org-slot flex w-full items-start bg-white dark:bg-black">
    {#if !isQuizPage(page.url?.pathname)}
      <OrgSidebar />
    {:else}
      <div class="flex-1">
        {#if data.orgName === '*'}
          <Box>Taking you to your organization...</Box>
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/if}

    {#if !isQuizPage(page.url?.pathname)}
      <div class="flex-1">
        {#if data.orgName === '*'}
          <Box>Taking you to your organization...</Box>
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/if}
  </div>
</div>
