<script lang="ts">
  import { page } from '$app/state';
  import { searchStore } from '../store/search-store.svelte';

  const scope = $derived(page.url.pathname.startsWith('/lms') ? 'lms' : 'org');

  function handleKeydown(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
      return;
    }

    event.preventDefault();
    searchStore.toggle(scope);
  }
</script>

<svelte:window onkeydown={handleKeydown} />
