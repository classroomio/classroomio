<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';

  export let hasUnsavedChanges = false;

  beforeNavigate(({ cancel }) => {
    if (!shouldAbandonChanges()) {
      cancel();
    } else {
      // User clicked OK, reset the flag
      hasUnsavedChanges = false;
    }
  });

  function shouldAbandonChanges() {
    if (!hasUnsavedChanges) return true;
    return window.confirm($t('common.unsaved_changes.message'));
  }
</script>

<svelte:window
  on:beforeunload={(e) => {
    const result = shouldAbandonChanges();
    if (!result) e.preventDefault();
  }}
/>

<slot />
