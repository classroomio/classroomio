<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import ArrowUpRightIcon from '$lib/components/Icons/ArrowTopRight.svelte';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';

  export let className = '';
</script>

<a href={$currentOrgDomain} target="_blank" class="{className} ml-2 hover:no-underline">
  <PrimaryButton>
    {#if !$isMobile}
      View site
    {/if}
    <ArrowUpRightIcon />
  </PrimaryButton>
</a>
