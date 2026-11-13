<script lang="ts">
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import type { Snippet } from 'svelte';
  import { Button } from '../../base/button';
  import * as Item from '../../base/item';
  import { cn } from '../../tools';

  interface Props {
    title: string;
    description?: string;
    completed?: boolean;
    /** Label of the disabled button that replaces `action` once the item is completed. */
    doneLabel: string;
    /** Media shown while the item is open; a completed item shows a check instead. */
    media?: Snippet;
    /** Controls shown while the item is open. */
    action?: Snippet;
    /** Runs when an open item is clicked. Completed items ignore clicks. */
    onclick?: () => void;
    testId?: string;
    class?: string;
  }

  let {
    title,
    description,
    completed = false,
    doneLabel,
    media,
    action,
    onclick,
    testId,
    class: className
  }: Props = $props();

  const isClickable = $derived(!completed && Boolean(onclick));
</script>

<Item.Root
  variant="muted"
  class={cn(
    completed && 'ui:cursor-not-allowed ui:opacity-60',
    !completed && !isClickable && 'ui:cursor-default',
    className
  )}
  onclick={isClickable ? onclick : undefined}
  aria-disabled={completed || undefined}
  data-completed={completed}
  data-testid={testId}
>
  {#if completed || media}
    <Item.Media variant="icon">
      {#if completed}
        <BadgeCheckIcon class="custom ui:size-5 ui:text-green-600" />
      {:else}
        {@render media?.()}
      {/if}
    </Item.Media>
  {/if}

  <Item.Content>
    <Item.Title class={completed ? 'ui:text-muted-foreground ui:line-through' : 'ui:font-semibold'}>
      {title}
    </Item.Title>
    {#if description}
      <Item.Description class={cn(completed && 'ui:line-through')}>{description}</Item.Description>
    {/if}
  </Item.Content>

  {#if completed || action}
    <Item.Actions>
      {#if completed}
        <Button variant="secondary" size="sm" disabled>{doneLabel}</Button>
      {:else}
        {@render action?.()}
      {/if}
    </Item.Actions>
  {/if}
</Item.Root>
