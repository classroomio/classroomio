<script>
  import Box from '$lib/components/Box/index.svelte';
  import AudienceList from './AudienceList.svelte';
  import AudienceEmptyIcon from '$lib/components/Icons/AudienceEmptyIcon.svelte';
  import { getOrgAudience } from '$lib/utils/services/org';
  import { orgAudience, currentOrg } from '$lib/utils/store/org';

  let isLoading = false;

  async function fetchInitData(orgId) {
    if (!orgId) return;

    isLoading = true;
    await getOrgAudience(orgId);
    isLoading = false;
  }

  $: fetchInitData($currentOrg.id);
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto"
>
  {#if $orgAudience.length || isLoading}
    <AudienceList {isLoading} />
  {:else}
    <Box>
      <AudienceEmptyIcon />
      <h3 class="dark:text-white text-2xl my-5">No audience to manage!</h3>
      <p class="dark:text-white w-1/3 text-center">
        Manage all your students here and stay connected with them.
      </p>
    </Box>
  {/if}
</div>
