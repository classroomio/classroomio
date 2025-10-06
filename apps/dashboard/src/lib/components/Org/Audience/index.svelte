<script>
  import Box from '$lib/components/Box/index.svelte';
  import AudienceList from './AudienceList.svelte';
  import AudienceEmptyIcon from '$lib/components/Icons/AudienceEmptyIcon.svelte';
  import { getOrgAudience } from '$lib/utils/services/org';
  import { orgAudience, currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = $state(false);

  async function fetchInitData(orgId) {
    if (!orgId) return;

    isLoading = true;
    await getOrgAudience(orgId);
    isLoading = false;
  }

  $effect(() => {
    fetchInitData($currentOrg.id);
  });
</script>

<div class="m-auto my-4 flex flex-wrap items-center justify-center lg:justify-start">
  {#if $orgAudience.length || isLoading}
    <AudienceList {isLoading} />
  {:else}
    <Box>
      <AudienceEmptyIcon />
      <h3 class="my-5 text-center text-2xl dark:text-white">{$t('audience.no_audience')}!</h3>
      <p class="w-1/3 text-center dark:text-white">
        {$t('audience.manage')}.
      </p>
    </Box>
  {/if}
</div>
