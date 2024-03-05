<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import ArrowUpRightIcon from '$lib/components/Icons/ArrowTopRight.svelte';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { t } from '$lib/utils/functions/translations';

  export let className = '';
</script>

<a href={$currentOrgDomain} target="_blank" class="{className} ml-2 hover:no-underline">
  <PrimaryButton>
    {#if !$isMobile}
      {$t('settings.subheadings.view_site')}
    {/if}
    <ArrowUpRightIcon />
  </PrimaryButton>
</a>
