<script lang="ts">
  import { Button, type ButtonProps } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { goto } from '$app/navigation';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';

  let {
    variant,
    isResponsive = false,
    onclick
  }: ButtonProps & {
    isResponsive?: boolean;
    onclick?: () => void;
  } = $props();

  function handleClick() {
    if (onclick) {
      onclick();
      return;
    }

    goto(`${$currentOrgPath}/paths?create=true`);
  }
</script>

{#if isResponsive && isMobileStore.current}
  <Button
    variant="outline"
    size="icon"
    aria-label={$t('learningPath.listing.create_path')}
    disabled={!$isOrgAdmin}
    onclick={handleClick}
  >
    <PlusIcon size={16} />
  </Button>
{:else}
  <Button {variant} onclick={handleClick} disabled={!$isOrgAdmin}>
    {$t('learningPath.listing.create_path')}
  </Button>
{/if}
