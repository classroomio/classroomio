<script lang="ts">
  import { onMount } from 'svelte';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { sidePanel, SidePanelRail } from '$features/side-panel';
  import { noteAiPanelDefinition } from '$features/notes/panel';

  let { children } = $props();

  sidePanel.register(noteAiPanelDefinition);

  const sidebar = useSidebar();
  let previousSidebarOpen = $state(true);
  let sidePanelWidth = $state(0);

  onMount(() => {
    previousSidebarOpen = sidebar.open;
    sidebar.setOpen(false);

    return () => {
      sidebar.setOpen(previousSidebarOpen);
      sidePanel.closeIfScope('notes');
    };
  });
</script>

<div
  class="notes-workspace flex min-h-0 w-full max-w-none flex-1 flex-col pt-2"
  style={`--side-panel-width: ${sidePanelWidth}px;`}
>
  {@render children?.()}
  <SidePanelRail onWidthPreview={(width) => (sidePanelWidth = width)} />
</div>
