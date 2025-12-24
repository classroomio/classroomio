<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { goto } from '$app/navigation';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import PlusIcon from '@lucide/svelte/icons/plus';

  let { isLMS = false }: { isLMS?: boolean } = $props();

  function askCommunity() {
    goto(`${isLMS ? '/lms/community/ask' : `${$currentOrgPath}/community/ask`}`);
  }
</script>

{#if isMobileStore.current}
  <Button onclick={askCommunity}>
    <PlusIcon size={16} />
  </Button>
{:else}
  <Button onclick={askCommunity}>
    {$t('community.ask_button')}
  </Button>
{/if}
