<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import SquareIcon from '@lucide/svelte/icons/square';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface ProgressStep {
    label: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    indent?: boolean;
  }

  interface Props {
    title: string;
    steps: ProgressStep[];
    currentAction?: string;
    onStop?: () => void;
    isStopped?: boolean;
    error?: string;
  }

  let { title, steps, currentAction, onStop, isStopped = false, error }: Props = $props();

  const completedCount = $derived(steps.filter((s) => s.status === 'completed').length);
  const totalCount = $derived(steps.length);
</script>

<div class="ui:bg-background rounded-lg border">
  <div class="border-b px-3 py-2">
    <h4 class="text-sm font-semibold">{title}</h4>
    <p class="ui:text-muted-foreground text-xs">
      {completedCount} / {totalCount} steps completed
    </p>
  </div>

  <div class="max-h-75 space-y-0.5 overflow-y-auto p-2">
    {#each steps as step, i (`${i}-${step.label}`)}
      <div class="flex items-center gap-2 rounded px-2 py-1 text-xs {step.indent ? 'ml-4' : ''}">
        {#if step.status === 'completed'}
          <CheckIcon size={12} class="ui:text-primary shrink-0" />
        {:else if step.status === 'in_progress'}
          <LoaderIcon size={12} class="ui:text-primary shrink-0 animate-spin" />
        {:else if step.status === 'failed'}
          <AlertCircleIcon size={12} class="shrink-0 text-red-500" />
        {:else}
          <CircleIcon size={12} class="ui:text-muted-foreground shrink-0" />
        {/if}
        <span class={step.status === 'completed' ? '' : step.status === 'pending' ? 'ui:text-muted-foreground' : ''}>
          {step.label}
        </span>
      </div>
    {/each}
  </div>

  <div class="space-y-1 border-t px-3 py-2">
    {#if error}
      <p class="text-xs text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if currentAction && !isStopped}
      <p class="ui:text-muted-foreground text-xs">{currentAction}</p>
    {/if}

    {#if isStopped}
      <p class="ui:text-muted-foreground text-xs">{$t('ai_assistant.stopped_content_kept')}</p>
    {/if}

    {#if onStop && !isStopped && completedCount < totalCount}
      <Button size="sm" variant="outline" onclick={onStop} class="w-full">
        <SquareIcon size={12} class="mr-1" />
        Stop
      </Button>
    {/if}
  </div>
</div>
