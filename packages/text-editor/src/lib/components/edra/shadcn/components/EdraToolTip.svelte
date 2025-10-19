<script lang="ts">
  import * as Tooltip from '../../../ui/tooltip/index.js';
  import type { Snippet } from 'svelte';
  interface Props {
    tooltip: string;
    children: Snippet<[]>;
    shortCut?: string;
  }

  const { tooltip, children, shortCut }: Props = $props();
</script>

<Tooltip.Provider delayDuration={100}>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {@render children()}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <span>{tooltip}</span>
      <span class="text-muted-foreground">{shortCut}</span>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
