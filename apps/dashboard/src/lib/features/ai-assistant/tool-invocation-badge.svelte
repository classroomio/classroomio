<script lang="ts">
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { getToolLabel, getToolResultLabel } from '$features/ai-assistant/utils/tool-labels';

  interface Props {
    toolName: string;
    state: string;
    result?: unknown;
  }

  let { toolName, state, result }: Props = $props();
</script>

<div class="ui:bg-background/50 flex items-center gap-2 rounded border px-2 py-1 text-xs">
  {#if state === 'call' || state === 'partial-call'}
    <LoaderIcon size={12} class="animate-spin" />
    <span class="ui:text-muted-foreground">
      {getToolLabel(toolName)}...
    </span>
  {:else if state === 'result'}
    <CheckIcon size={12} class="ui:text-primary" />
    <span>
      {getToolResultLabel(toolName, result)}
    </span>
  {/if}
</div>
