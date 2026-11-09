<script lang="ts">
  import { onDestroy } from 'svelte';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import type { Snippet } from 'svelte';
  import Item from './add-block-item.svelte';
  import type { AddBlockChoice, AddBlockShortcut } from './types';

  interface Props {
    choices: AddBlockChoice[];
    addLabel: string;
    aiLabel?: string;
    aiPanelLabel?: string;
    aiShortcut?: AddBlockShortcut | null;
    aiOpen?: boolean;
    showAi?: boolean;
    rowTestId?: string;
    toolbarTestId?: string;
    aiTriggerTestId?: string;
    aiPanelTestId?: string;
    onSelect: (type: string) => void;
    onAiTrigger?: () => void;
    aiPanel?: Snippet;
  }

  let {
    choices,
    addLabel,
    aiLabel = 'Ask AI',
    aiPanelLabel,
    aiShortcut = null,
    aiOpen = false,
    showAi = true,
    rowTestId,
    toolbarTestId,
    aiTriggerTestId,
    aiPanelTestId,
    onSelect,
    onAiTrigger,
    aiPanel
  }: Props = $props();

  const OPEN_MS = 500;
  const CLOSE_MS = 300;
  const OPEN_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const CLOSE_EASING = 'cubic-bezier(0.4, 0, 1, 1)';
  const CLIP_OPEN = 'inset(0px 0px 0px 0px round 12px)';

  let rowElement = $state<HTMLDivElement | null>(null);
  let triggerElement = $state<HTMLButtonElement | null>(null);
  let panelElement = $state<HTMLDivElement | null>(null);
  let closing = $state(false);
  let clipFrom = $state(CLIP_OPEN);
  let panelAnimation: Animation | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let previousOpen = false;

  const active = $derived(aiOpen || closing);
  const panelClip = $derived(aiOpen ? CLIP_OPEN : clipFrom);

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function animatePanel(fromClip: string, toClip: string, duration: number, easing: string) {
    if (!panelElement || prefersReducedMotion()) return;

    panelAnimation?.cancel();
    panelAnimation = panelElement.animate([{ clipPath: fromClip }, { clipPath: toClip }], { duration, easing });
  }

  function measureClip() {
    if (!rowElement || !triggerElement) return CLIP_OPEN;

    const rowBounds = rowElement.getBoundingClientRect();
    const triggerBounds = triggerElement.getBoundingClientRect();
    const clipLeft = Math.max(0, triggerBounds.left - rowBounds.left);
    const clipRight = Math.max(0, rowBounds.right - triggerBounds.right);

    return `inset(0px ${clipRight}px 0px ${clipLeft}px round 12px)`;
  }

  function openPanel() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    }

    closing = false;
    clipFrom = measureClip();
    animatePanel(clipFrom, CLIP_OPEN, OPEN_MS, OPEN_EASING);
  }

  function closePanel() {
    if (!panelElement) return;

    closing = true;
    animatePanel(CLIP_OPEN, clipFrom, CLOSE_MS, CLOSE_EASING);

    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(
      () => {
        closeTimer = undefined;
        closing = false;

        const activeElement = document.activeElement;
        const shouldRestoreFocus =
          !activeElement || activeElement === document.body || rowElement?.contains(activeElement);
        if (shouldRestoreFocus) triggerElement?.focus();
      },
      prefersReducedMotion() ? 0 : CLOSE_MS
    );
  }

  $effect(() => {
    if (aiOpen === previousOpen) return;

    previousOpen = aiOpen;
    if (aiOpen) {
      openPanel();
    } else {
      closePanel();
    }
  });

  onDestroy(() => {
    panelAnimation?.cancel();
    if (closeTimer) clearTimeout(closeTimer);
  });
</script>

<div
  bind:this={rowElement}
  class="ui:bg-background/95 ui:border-border ui:relative ui:inline-flex ui:items-center ui:gap-0 ui:rounded-lg ui:border ui:px-2 ui:py-1"
  data-testid={rowTestId}
>
  {#if showAi}
    <button
      bind:this={triggerElement}
      type="button"
      class="ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-primary ui:flex ui:items-center ui:gap-1.5 ui:rounded-sm ui:px-2.5 ui:py-2 ui:text-[13px] ui:font-medium ui:transition ui:active:scale-95"
      onclick={onAiTrigger}
      title={aiLabel}
      aria-label={aiLabel}
      aria-expanded={aiOpen}
      data-testid={aiTriggerTestId}
    >
      <SparklesIcon size={14} class="custom ui:hover:text-primary" />
      <span class="ui:hidden ui:text-nowrap ui:sm:inline">{aiLabel}</span>
      {#if aiShortcut}
        <div
          class="ui:bg-muted-foreground ui:bg-border ui:my-[2px] ui:hidden ui:w-[1.5px] ui:self-stretch ui:md:inline-block"
          role="separator"
          aria-orientation="vertical"
        ></div>
        <span class="ui:text-muted-foreground ui:hidden ui:items-center ui:gap-0.5 ui:text-[10px] ui:sm:flex">
          <kbd
            class="ui:bg-muted ui:hover:text-primary ui:rounded ui:px-1 ui:py-0.5 ui:font-mono ui:text-[9px] ui:shadow-xs"
            >{aiShortcut.modifier}</kbd
          >
          <kbd class="ui:rounded ui:px-1 ui:py-0.5 ui:font-mono ui:text-[9px] ui:shadow-xs">{aiShortcut.key}</kbd>
        </span>
      {/if}
    </button>

    <div
      class="ui:bg-border ui:mx-1 ui:my-[2px] ui:w-px ui:self-stretch"
      role="separator"
      aria-orientation="vertical"
    ></div>
  {/if}

  <div
    class="ui:flex ui:items-center ui:gap-0"
    role="toolbar"
    tabindex="-1"
    aria-label={addLabel}
    inert={aiOpen}
    data-testid={toolbarTestId}
  >
    {#each choices as choice (choice.type)}
      <Item {choice} hideLabelOnMobile {onSelect} />
    {/each}
  </div>

  {#if aiPanel}
    <div
      bind:this={panelElement}
      class="ui:bg-background ui:absolute ui:inset-0 ui:flex ui:items-center ui:px-2.5 {active
        ? 'ui:opacity-100'
        : 'ui:pointer-events-none ui:opacity-0'}"
      style:clip-path={panelClip}
      inert={!aiOpen}
      role="group"
      aria-label={aiPanelLabel}
      data-testid={aiPanelTestId}
    >
      {@render aiPanel()}
    </div>
  {/if}
</div>
