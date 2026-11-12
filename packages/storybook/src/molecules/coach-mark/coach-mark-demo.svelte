<script lang="ts">
  import CirclePlayIcon from '@lucide/svelte/icons/circle-play';
  import { Button } from '@cio/ui/base/button';
  import { CoachMark } from '@cio/ui/custom/coach-mark';

  interface Props {
    title: string;
    description?: string;
    dismissLabel: string;
    actionLabel?: string;
    align?: 'start' | 'end';
    storageKey?: string;
    showIcon?: boolean;
  }

  let { title, description, dismissLabel, actionLabel, align = 'end', storageKey, showIcon = false }: Props = $props();

  let lastEvent = $state('none');
  let resetCount = $state(0);

  function reset() {
    if (storageKey) localStorage.removeItem(storageKey);
    lastEvent = 'none';
    resetCount += 1;
  }
</script>

<div class="flex h-80 w-160 max-w-full flex-col gap-4">
  <div class="flex items-center justify-between gap-4 text-sm">
    <span>Last event: {lastEvent}</span>
    <Button size="sm" variant="outline" onclick={reset}>Show again</Button>
  </div>

  <div class="flex {align === 'end' ? 'justify-end' : 'justify-start'}">
    <div class="relative">
      <Button variant="outline">Edit</Button>
      {#key resetCount}
        <CoachMark
          {title}
          {description}
          {dismissLabel}
          {actionLabel}
          {align}
          {storageKey}
          actionIcon={showIcon ? actionIcon : undefined}
          onAction={() => (lastEvent = 'action')}
          onDismiss={() => (lastEvent = 'dismiss')}
        />
      {/key}
    </div>
  </div>
</div>

{#snippet actionIcon()}
  <CirclePlayIcon class="size-4" />
{/snippet}
