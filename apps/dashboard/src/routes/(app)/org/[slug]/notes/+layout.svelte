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

  onMount(() => {
    const wasSidebarOpen = sidebar.open;
    sidebar.setOpen(false);

    return () => {
      sidebar.setOpen(wasSidebarOpen);
    };
  });
</script>

<div
  class="notes-workspace flex min-h-0 w-full flex-1 flex-col overflow-hidden"
  style={`--side-panel-width: ${sidePanelWidth}px;`}
>
  {@render children?.()}
  <SidePanelRail onWidthPreview={(width) => (sidePanelWidth = width)} />
</div>
