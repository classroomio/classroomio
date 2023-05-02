<script>
  import { onMount } from 'svelte';
  import Box from '../../Box/index.svelte';
  import AudienceList from './AudienceList.svelte';
  import AudienceEmptyIcon from '../../Icons/AudienceEmptyIcon.svelte';
  import { getOrgAudience } from '../../../utils/services/org';
  import { orgAudience, currentOrg } from '../../../utils/store/org';

  let isLoading = false;
  onMount(async () => {
    isLoading = true;
    await getOrgAudience($currentOrg.id);
    isLoading = false;
  });
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto"
>
  {#if $orgAudience.length || isLoading}
    <AudienceList {isLoading} />
  {:else}
    <Box>
      <AudienceEmptyIcon />
      <h3 class="text-2xl my-5">No audience to manage!</h3>
      <p class="w-1/3 text-center">
        Manage all your students here and stay connected with them.
      </p>
    </Box>
  {/if}
</div>
