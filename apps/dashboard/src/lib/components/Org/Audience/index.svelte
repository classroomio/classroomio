<script>
  import Box from '$lib/components/Box/index.svelte';
  import AudienceList from './AudienceList.svelte';
  import AudienceEmptyIcon from '$lib/components/Icons/AudienceEmptyIcon.svelte';
  import { getOrgAudience } from '$lib/utils/services/org';
  import { orgAudience, currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = false;

  async function fetchInitData(orgId) {
    if (!orgId) return;

    isLoading = true;
    await getOrgAudience(orgId);
    isLoading = false;
  }

  $: fetchInitData($currentOrg.id);
</script>

<div class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto">
  {#if $orgAudience.length || isLoading}
    <AudienceList {isLoading} />
  {:else}
    <Box>
      <AudienceEmptyIcon />
      <h3 class="dark:text-white text-2xl text-center my-5">{$t('audience.no_audience')}!</h3>
      <p class="dark:text-white w-1/3 text-center">
        {$t('audience.manage')}.
      </p>
    </Box>
  {/if}
</div>
