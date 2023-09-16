<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import ArrowUpRightIcon from '$lib/components/Icons/ArrowTopRight.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';

  export let className = '';
</script>

<a
  href={`https://${$currentOrg.siteName}.classroomio.com`}
  target="_blank"
  class="{className} ml-2 hover:no-underline"
>
  <PrimaryButton>
    {#if !$isMobile}
      View site
    {/if}
    <ArrowUpRightIcon />
  </PrimaryButton>
</a>
