<script lang="ts">
  import { onMount } from 'svelte';
  import { aiAssistantPanelDefinition } from '$features/ai-assistant';
  import { sidePanel, SidePanelRail } from '$features/side-panel';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { noteCommentsPanelDefinition } from '$features/notes/panel';

  let { children } = $props();

  const sidebar = useSidebar();

  sidePanel.register(aiAssistantPanelDefinition);
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
  class="notes-workspace -mx-4 flex min-h-[calc(100dvh-4rem)] w-[calc(100%+2rem)] max-w-none flex-1 flex-col"
  style={`--side-panel-width: ${sidePanelWidth}px;`}
>
  {@render children?.()}
  <SidePanelRail onWidthPreview={(width) => (sidePanelWidth = width)} />
</div>
