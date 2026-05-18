<script lang="ts">
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ToolLine from '$features/ai-assistant/utils/tool-line.svelte';
  import { getCompletedToolLine, getPendingToolLine } from '$features/ai-assistant/utils/tool-labels';

  interface Props {
    toolName: string;
    state: string;
    result?: unknown;
    /** Required for linked lesson/exercise summaries in ToolLine rows */
    courseId: string;
    onNavigate?: (route: string) => void;
  }

  let { toolName, state, result, courseId, onNavigate = () => {} }: Props = $props();
</script>

<div class="ui:bg-background/50 flex items-center gap-2 rounded border px-2 py-1 text-xs">
  {#if state === 'call' || state === 'partial-call'}
    <LoaderIcon size={12} class="animate-spin" />
    <span class="ui:text-muted-foreground inline-flex flex-wrap gap-x-1">
      <ToolLine line={getPendingToolLine(toolName)} {courseId} {onNavigate} />…
    </span>
  {:else if state === 'result'}
    <CheckIcon size={12} class="ui:text-primary" />
    <span><ToolLine line={getCompletedToolLine(toolName, result)} {courseId} {onNavigate} /></span>
  {/if}
</div>
