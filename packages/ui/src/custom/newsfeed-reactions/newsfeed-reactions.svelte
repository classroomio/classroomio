<script lang="ts">
  import * as Popover from '../../base/popover';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import SmileIcon from '@lucide/svelte/icons/smile';
  import {
    NEWSFEED_REACTION_OPTIONS,
    type NewsfeedReactionCounts,
    type NewsfeedReactionType
  } from './newsfeed-reactions';

  interface Props {
    reactionCounts?: NewsfeedReactionCounts;
    selectedReactionType?: NewsfeedReactionType | null;
    disabled?: boolean;
    class?: string;
    open?: boolean;
    onReactionToggle?: (reactionType: NewsfeedReactionType) => void | Promise<void>;
  }

  let {
    reactionCounts = {},
    selectedReactionType = null,
    disabled = false,
    class: className = '',
    open = $bindable(false),
    onReactionToggle = () => {}
  }: Props = $props();

  const hasVisibleReactions = $derived(
    NEWSFEED_REACTION_OPTIONS.some((reactionOption) => (reactionCounts[reactionOption.type] ?? 0) > 0)
  );

  function handleReactionToggle(reactionType: NewsfeedReactionType) {
    if (disabled) {
      return;
    }

    open = false;
    void onReactionToggle(reactionType);
  }
</script>

<div class={cn('ui:flex ui:items-center ui:gap-2', className)}>
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          type="button"
          variant={open ? 'light-default' : 'outline'}
          size="icon-sm"
          class="ui:rounded-xl ui:shadow-none"
          {disabled}
          aria-label="Open reactions"
        >
          <SmileIcon class="ui:size-4" />
        </Button>
      {/snippet}
    </Popover.Trigger>

    <Popover.Content side="top" align="start" sideOffset={10} class="ui:w-auto ui:max-w-none ui:p-1!">
      <div class="ui:grid ui:grid-cols-4 ui:gap-2">
        {#each NEWSFEED_REACTION_OPTIONS as reactionOption (reactionOption.type)}
          <Button
            type="button"
            variant={selectedReactionType === reactionOption.type ? 'light-default' : 'ghost'}
            size="icon-xs"
            class="ui:rounded-full"
            {disabled}
            aria-label={reactionOption.label}
            onclick={() => handleReactionToggle(reactionOption.type)}
          >
            <span>{reactionOption.emoji}</span>
          </Button>
        {/each}
      </div>
    </Popover.Content>
  </Popover.Root>

  {#if hasVisibleReactions}
    <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-1">
      {#each NEWSFEED_REACTION_OPTIONS as reactionOption (reactionOption.type)}
        {@const count = reactionCounts[reactionOption.type] ?? 0}
        {#if count > 0}
          <Button
            type="button"
            variant={selectedReactionType === reactionOption.type ? 'light-default' : 'ghost'}
            size="sm"
            class="ui:h-8 ui:rounded-full ui:px-3"
            {disabled}
            aria-label={reactionOption.label}
            onclick={() => handleReactionToggle(reactionOption.type)}
          >
            <span aria-hidden="true" class="ui:text-sm ui:leading-none">{reactionOption.emoji}</span>
            <span class="ui:text-xs ui:font-medium">{count}</span>
          </Button>
        {/if}
      {/each}
    </div>
  {/if}
</div>
