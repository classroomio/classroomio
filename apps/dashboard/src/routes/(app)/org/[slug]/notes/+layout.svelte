<script lang="ts">
  import { onMount } from 'svelte';
  import { sidePanel, SidePanelRail } from '$features/side-panel';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { noteAiPanelDefinition, noteCommentsPanelDefinition } from '$features/notes/panel';

  let { children } = $props();

  const sidebar = useSidebar();

  sidePanel.register(noteAiPanelDefinition);
  sidePanel.register(noteCommentsPanelDefinition);

  let sidePanelWidth = $state(0);

  function handleSearchShortcut(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
      return;
    }

    event.preventDefault();
    window.dispatchEvent(new CustomEvent('notes:open-search'));
  }

  onMount(() => {
    const wasSidebarOpen = sidebar.open;
    sidebar.setOpen(false);

    return () => {
      sidebar.setOpen(wasSidebarOpen);
    };
  });
</script>

<svelte:window onkeydown={handleSearchShortcut} />

<div
  class="notes-workspace flex h-full min-h-0 w-full flex-col overflow-hidden"
  style={`--side-panel-width: ${sidePanelWidth}px;`}
>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    {@render children?.()}
  </div>
  <SidePanelRail onWidthPreview={(width) => (sidePanelWidth = width)} />
</div>
