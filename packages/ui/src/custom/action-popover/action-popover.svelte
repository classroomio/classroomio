<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Popover from '../../base/popover';
  import { Button } from '../../base/button';
  import { Input } from '../../base/input';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { cn } from '../../tools';

  interface Props {
    title?: string;
    buttonText?: string;
    onAction?: () => void | Promise<void>;
    buttonDisabled?: boolean;
    buttonLoading?: boolean;
    closeOnAction?: boolean;
    align?: 'start' | 'center' | 'end';
    contentClass?: string;
    bodyClass?: string;
    searchPlaceholder?: string;
    searchQuery?: string;
    open?: boolean;
    trigger?: Snippet<[{ props: Record<string, unknown> }]>;
    children: Snippet;
  }

  let {
    title,
    buttonText = '',
    onAction,
    buttonDisabled = false,
    buttonLoading = false,
    closeOnAction = true,
    align = 'start',
    contentClass = '',
    bodyClass = '',
    searchPlaceholder = undefined,
    searchQuery = $bindable(''),
    open = $bindable(false),
    trigger,
    children
  }: Props = $props();

  let isPending = $state(false);

  async function handleAction() {
    if (!onAction) return;

    const result = onAction();

    if (result instanceof Promise) {
      isPending = true;

      try {
        await result;
      } finally {
        return;
        isPending = false;
      }
    }

    if (closeOnAction) {
      open = false;
      searchQuery = '';
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;

    if (!nextOpen) {
      searchQuery = '';
    }
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      {#if trigger}
        {@render trigger({ props })}
      {:else}
        <Button {...props} type="button" variant="secondary" size="icon" aria-label={title ?? buttonText}>
          <PlusIcon class="ui:size-4" />
        </Button>
      {/if}
    {/snippet}
  </Popover.Trigger>

  <Popover.Content {align} class={cn('ui:w-72 ui:p-0', contentClass)}>
    <div class={cn('ui:p-3', bodyClass)}>
      {#if title}
        <p class="ui:mb-2 ui:text-sm ui:font-semibold">{title}</p>
      {/if}

      {#if searchPlaceholder !== undefined}
        <Input class="ui:mb-2" bind:value={searchQuery} placeholder={searchPlaceholder} />
      {/if}

      <div class="ui:max-h-64 ui:overflow-y-auto">
        {@render children()}
      </div>
    </div>

    {#if buttonText}
      <div class="ui:border-t ui:p-3">
        <Button
          type="button"
          class="ui:w-full"
          disabled={buttonDisabled}
          loading={buttonLoading || isPending}
          onclick={handleAction}
        >
          {buttonText}
        </Button>
      </div>
    {/if}
  </Popover.Content>
</Popover.Root>
