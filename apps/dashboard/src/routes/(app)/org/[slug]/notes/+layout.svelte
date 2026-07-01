<script lang="ts">
  import { onMount } from 'svelte';
  import { useSidebar } from '@cio/ui/base/sidebar';

  let { children } = $props();

  const sidebar = useSidebar();
  let previousSidebarOpen = $state(true);

  onMount(() => {
    previousSidebarOpen = sidebar.open;
    sidebar.setOpen(false);

    return () => {
      sidebar.setOpen(previousSidebarOpen);
    };
  });
</script>

<div class="notes-workspace -mx-4 flex w-[calc(100%+2rem)] max-w-none flex-col">
  {@render children?.()}
</div>
