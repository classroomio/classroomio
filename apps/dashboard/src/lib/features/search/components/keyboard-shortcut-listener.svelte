<script lang="ts">
  import { page } from '$app/state';
  import { searchStore } from '../store/search-store.svelte';

  const scope = $derived(page.url.pathname.startsWith('/lms') ? 'lms' : 'org');
  const isDocsWorkspace = $derived(/\/docs(?:\/|$)/.test(page.url.pathname));

  function handleKeydown(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
      return;
    }

    // Notes workspace registers its own notes-only search modal on ⌘K.
    if (isDocsWorkspace) {
      return;
    }

    event.preventDefault();
    searchStore.toggle(scope);
  }
</script>

<svelte:window onkeydown={handleKeydown} />
