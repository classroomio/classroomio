<script lang="ts">
  import { aiAssistantPanelDefinition } from '$features/ai-assistant';
  import { sidePanel, SidePanelRail } from '$features/side-panel';

  let { children } = $props();

  sidePanel.register(aiAssistantPanelDefinition);

  let sidePanelWidth = $state(0);
</script>

<div
  class="notes-workspace flex min-h-0 w-full max-w-none flex-1 flex-col pt-2"
  style={`--side-panel-width: ${sidePanelWidth}px;`}
>
  {@render children?.()}
  <SidePanelRail onWidthPreview={(width) => (sidePanelWidth = width)} />
</div>
