<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { basePath } from '$lib/utils/store/app';
  import { Button } from '@cio/ui/base/button';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import PlusIcon from '@lucide/svelte/icons/plus';

  function askCommunity() {
    goto(resolve(`${$basePath}/community/ask`, {}));
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
