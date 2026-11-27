<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { cn } from '../../tools';
  import Catalog from './add-block-catalog.svelte';
  import type { AddBlockChoice } from './types';

  interface Props {
    choices: AddBlockChoice[];
    label: string;
    searchLabel?: string;
    noResultsLabel?: string;
    newLabel?: string;
    comingSoonLabel?: string;
    /** Opens the popover above the trigger (`top`) or below it (`bottom`). */
    side?: 'top' | 'bottom';
    align?: 'center' | 'end';
    class?: string;
    testId?: string;
    onSelect: (type: string) => void;
    trigger: Snippet<[{ open: boolean; toggle: () => void }]>;
  }

  let {
    choices,
    label,
    searchLabel,
    noResultsLabel,
    newLabel,
    comingSoonLabel,
    side = 'top',
    align = 'end',
    class: className,
    testId,
    onSelect,
    trigger
  }: Props = $props();

  let open = $state(false);
  let containerElement = $state<HTMLDivElement | null>(null);
  let popoverElement = $state<HTMLDivElement | null>(null);

  async function toggle() {
    open = !open;
    if (!open) return;

    await tick();
    popoverElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function select(type: string) {
    open = false;
    onSelect(type);
  }

  function handleWindowClick(event: MouseEvent) {
    if (!open || containerElement?.contains(event.target as Node)) return;

    open = false;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class={cn('ui:relative', className)} bind:this={containerElement}>
  {@render trigger({ open, toggle })}

  {#if open}
    <div
      class={cn(
        'ui:border-border ui:bg-popover ui:absolute ui:z-50 ui:flex ui:max-h-[min(480px,70vh)] ui:w-[min(560px,calc(100vw-32px))] ui:flex-col ui:overflow-y-auto ui:rounded-xl ui:border ui:p-2.5 ui:text-left ui:shadow-lg ui:animate-in ui:fade-in ui:zoom-in-[.97] ui:duration-150',
        side === 'top'
          ? 'ui:bottom-full ui:mb-3 ui:origin-bottom ui:slide-in-from-bottom-1.5'
          : 'ui:top-full ui:mt-2 ui:origin-top ui:slide-in-from-top-1.5',
        align === 'end' ? 'ui:right-0' : 'ui:left-1/2 ui:-translate-x-1/2'
      )}
      bind:this={popoverElement}
      role="dialog"
      aria-label={label}
      data-testid={testId ? `${testId}-menu` : undefined}
    >
      <Catalog
        {choices}
        {label}
        {searchLabel}
        {noResultsLabel}
        {newLabel}
        {comingSoonLabel}
        autofocus
        testId={testId ? `${testId}-grid` : undefined}
        onSelect={select}
      />
    </div>
  {/if}
</div>
