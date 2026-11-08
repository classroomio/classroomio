<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import Item from './add-block-item.svelte';
  import type { AddBlockChoice } from './types';

  interface Props {
    open: boolean;
    choices: AddBlockChoice[];
    addLabel?: string;
    testId?: string;
    onToggle: () => void;
    onClose: () => void;
    onSelect: (type: string) => void;
  }

  let { open, choices, addLabel = 'Add content', testId, onToggle, onClose, onSelect }: Props = $props();

  function select(type: string) {
    onClose();
    onSelect(type);
  }
</script>

<div class="ui:group/lines ui:relative ui:my-4 ui:flex ui:w-full ui:items-center ui:py-1">
  <div class="ui:group/gap ui:flex ui:w-full ui:items-center ui:justify-center ui:gap-4">
    <div
      class={cn(
        'ui:bg-primary ui:z-40 ui:h-[2px] ui:w-full ui:transition-opacity ui:duration-150',
        open ? 'ui:opacity-100' : 'ui:opacity-0 ui:group-hover/gap:opacity-100 ui:group-focus-within/gap:opacity-100'
      )}
    ></div>

    <IconButton
      type="button"
      size="icon-sm"
      {testId}
      class={cn(
        'ui:relative ui:z-40 ui:rounded-full',
        open
          ? 'ui:border-primary ui:bg-primary ui:scale-110 ui:text-white'
          : 'ui:border-border ui:bg-background ui:text-muted-foreground ui:hover:border-primary ui:hover:bg-primary ui:hover:text-primary-foreground ui:hover:scale-105'
      )}
      aria-label={addLabel}
      aria-expanded={open}
      onclick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <PlusIcon size={12} class="custom" />
    </IconButton>

    <div
      class={cn(
        'ui:bg-primary ui:z-40 ui:h-[2px] ui:w-full ui:transition-opacity ui:duration-150',
        open ? 'ui:opacity-100' : 'ui:opacity-0 ui:group-hover/gap:opacity-100 ui:group-focus-within/gap:opacity-100'
      )}
    ></div>
  </div>

  {#if open}
    <div
      class="ui:border-border ui:bg-background ui:absolute ui:bottom-full ui:left-1/2 ui:z-50 ui:mb-3 ui:flex ui:-translate-x-1/2 ui:animate-in ui:items-center ui:rounded-md ui:border ui:p-1 ui:shadow-md ui:fade-in ui:zoom-in-95 ui:duration-150"
      role="toolbar"
      tabindex="-1"
      aria-label={addLabel}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      {#each choices as choice (choice.type)}
        <Item {choice} compact onSelect={select} />
      {/each}
    </div>
  {/if}
</div>
