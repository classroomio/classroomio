<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    hasUnsavedChanges?: boolean;
    skipPrompt?: boolean;
    children?: import('svelte').Snippet;
  }

  let { hasUnsavedChanges = $bindable(false), skipPrompt = false, children }: Props = $props();

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
    if (skipPrompt) return true;
    return window.confirm($t('common.unsaved_changes.message'));
  }
</script>

<svelte:window
  onbeforeunload={(e) => {
    const result = shouldAbandonChanges();
    if (!result) e.preventDefault();
  }}
/>

{@render children?.()}
