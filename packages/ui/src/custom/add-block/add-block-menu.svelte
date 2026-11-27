<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { tick } from 'svelte';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import AiButton from './add-block-ai-button.svelte';
  import Grid from './add-block-grid.svelte';
  import type { AddBlockChoice, AddBlockShortcut } from './types';

  interface Props {
    open: boolean;
    choices: AddBlockChoice[];
    addLabel?: string;
    aiLabel?: string;
    aiShortcut?: AddBlockShortcut | null;
    newLabel?: string;
    testId?: string;
    onToggle: () => void;
    onClose: () => void;
    onSelect: (type: string) => void;
    onAi?: () => void;
  }

  let {
    open,
    choices,
    addLabel = 'Add content',
    aiLabel,
    aiShortcut = null,
    newLabel,
    testId,
    onToggle,
    onClose,
    onSelect,
    onAi
  }: Props = $props();

  const MENU_GAP = 4;
  const VIEWPORT_MARGIN = 8;

  let opensBelow = $state(false);
  let maxHeight = $state<number | null>(null);
  let anchorRef = $state<HTMLElement | null>(null);
  let menuRef = $state<HTMLElement | null>(null);

  function select(type: string) {
    onClose();
    onSelect(type);
  }

  function askAi() {
    onClose();
    onAi?.();
  }

  async function toggle() {
    const wasOpen = open;
    onToggle();
    if (wasOpen) return;

    opensBelow = false;
    maxHeight = null;
    await tick();
    placeMenu();
  }

  /**
   * Opens the menu above the row when it fits, below when only that side fits, and otherwise on the
   * roomier side with a height cap so it scrolls instead of leaving the viewport.
   */
  function placeMenu() {
    if (!anchorRef || !menuRef) return;

    const anchor = anchorRef.getBoundingClientRect();
    const menuHeight = menuRef.scrollHeight + MENU_GAP;
    const spaceAbove = anchor.top - VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - anchor.bottom - VIEWPORT_MARGIN;

    if (menuHeight <= spaceAbove) return;

    opensBelow = menuHeight <= spaceBelow || spaceBelow > spaceAbove;
    if (menuHeight > Math.max(spaceAbove, spaceBelow)) {
      maxHeight = Math.max(spaceAbove, spaceBelow) - MENU_GAP;
    }
  }
</script>

<div class="ui:group/lines ui:relative ui:my-4 ui:flex ui:w-full ui:items-center ui:py-1" bind:this={anchorRef}>
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
          : 'ui:border-border ui:bg-muted ui:text-muted-foreground ui:hover:border-primary ui:hover:bg-primary ui:hover:text-primary-foreground ui:hover:scale-105'
      )}
      aria-label={addLabel}
      aria-expanded={open}
      onclick={(event) => {
        event.stopPropagation();
        void toggle();
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
      class={cn(
        'ui:border-border ui:bg-popover ui:absolute ui:left-1/2 ui:z-50 ui:flex ui:w-[min(440px,calc(100vw-32px))] ui:-translate-x-1/2 ui:flex-col ui:gap-2 ui:rounded-xl ui:border ui:p-2.5 ui:shadow-lg ui:animate-in ui:fade-in ui:zoom-in-[.97] ui:duration-150',
        opensBelow
          ? 'ui:top-full ui:mt-1 ui:origin-top ui:slide-in-from-top-1.5'
          : 'ui:bottom-full ui:mb-1 ui:origin-bottom ui:slide-in-from-bottom-1.5',
        maxHeight !== null && 'ui:overflow-y-auto'
      )}
      style:max-height={maxHeight !== null ? `${maxHeight}px` : undefined}
      bind:this={menuRef}
      role="dialog"
      tabindex="-1"
      aria-label={addLabel}
      data-testid={testId ? `${testId}-menu` : undefined}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      <Grid
        {choices}
        label={addLabel}
        size="sm"
        {newLabel}
        testId={testId ? `${testId}-grid` : undefined}
        onSelect={select}
      />
      {#if onAi && aiLabel}
        <AiButton
          label={aiLabel}
          shortcut={aiShortcut}
          variant="menu"
          testId={testId ? `${testId}-ai` : undefined}
          onclick={askAi}
        />
      {/if}
    </div>
  {/if}
</div>
