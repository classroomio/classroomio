<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '../../base/button';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

  interface Props {
    replyCount?: number;
    showLabel?: string;
    hideLabel?: string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    class?: string;
    children?: Snippet;
  }

  let {
    replyCount = 0,
    showLabel,
    hideLabel = 'Hide replies',
    isExpanded = $bindable(false),
    onToggleExpand,
    class: className = '',
    children
  }: Props = $props();

  const label = $derived(
    isExpanded ? hideLabel : (showLabel ?? `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`)
  );

  function handleToggle() {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      isExpanded = !isExpanded;
    }
  }
</script>

{#if replyCount > 0 || isExpanded || children}
  <div class="ui:flex ui:flex-col ui:gap-2 ui:pl-11 {className}">
    {#if replyCount > 0}
      <Button
        variant="ghost"
        size="xs"
        onclick={handleToggle}
        class="ui:w-fit ui:gap-1.5 ui:px-0 ui:text-xs ui:font-medium ui:text-muted-foreground ui:hover:bg-transparent ui:hover:text-foreground"
      >
        {#if isExpanded}
          <ChevronUpIcon size={14} />
        {:else}
          <ChevronDownIcon size={14} />
        {/if}
        <span>{label}</span>
      </Button>
    {/if}

    {#if isExpanded}
      <div class="ui:relative ui:flex ui:flex-col ui:gap-3 ui:border-l-2 ui:border-border/60 ui:pl-6">
        {@render children?.()}
      </div>
    {/if}
  </div>
{/if}
