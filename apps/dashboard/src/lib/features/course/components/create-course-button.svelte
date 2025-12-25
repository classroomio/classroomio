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
    isResponsive = false
  }: ButtonProps & {
    isResponsive?: boolean;
  } = $props();

  function onClick() {
    goto(`${$currentOrgPath}/courses?create=true`);
  }
</script>

{#if isResponsive && isMobileStore.current}
  <Button variant="outline" size="icon" disabled={!$isOrgAdmin} onclick={onClick}>
    <PlusIcon size={16} />
  </Button>
{:else}
  <Button {variant} onclick={onClick} disabled={!$isOrgAdmin}>{$t('courses.heading_button')}</Button>
{/if}
