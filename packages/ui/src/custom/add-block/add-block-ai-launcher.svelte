<script lang="ts">
  import { onDestroy, tick, type Snippet } from 'svelte';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { cn } from '../../tools';
  import type { AddBlockShortcut } from './types';

  interface Props {
    label: string;
    panelLabel?: string;
    shortcut?: AddBlockShortcut | null;
    open: boolean;
    testId?: string;
    triggerTestId?: string;
    panelTestId?: string;
    onOpen: () => void;
    panel: Snippet;
  }

  let { label, panelLabel, shortcut = null, open, testId, triggerTestId, panelTestId, onOpen, panel }: Props = $props();

  const WIDTH_OPEN_MS = 320;
  const WIDTH_CLOSE_MS = 240;
  const REVEAL_MS = 500;
  const CONCEAL_MS = 300;
  const OPEN_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const CLOSE_EASING = 'cubic-bezier(0.4, 0, 1, 1)';
  const CLIP_OPEN = 'inset(0px 0px 0px 0px round 12px)';

  let rootElement = $state<HTMLDivElement | null>(null);
  let triggerElement = $state<HTMLButtonElement | null>(null);
  let panelElement = $state<HTMLDivElement | null>(null);
  let expanded = $state(false);
  let revealed = $state(false);
  let clipFrom = $state(CLIP_OPEN);
  let runningAnimations: Animation[] = [];
  let previousOpen = false;
  let transitionId = 0;

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function cancelAnimations() {
    runningAnimations.forEach((animation) => animation.cancel());
    runningAnimations = [];
  }

  async function play(
    element: HTMLElement | null,
    keyframes: Keyframe[],
    duration: number,
    easing: string,
    fill: FillMode = 'none'
  ) {
    if (!element || prefersReducedMotion()) return;

    const animation = element.animate(keyframes, { duration, easing, fill });
    runningAnimations.push(animation);
    await animation.finished.catch(() => undefined);
  }

  function measureTriggerClip() {
    if (!rootElement || !triggerElement) return CLIP_OPEN;

    const rootBounds = rootElement.getBoundingClientRect();
    const triggerBounds = triggerElement.getBoundingClientRect();
    const clipRight = Math.max(0, rootBounds.right - triggerBounds.right);

    return `inset(0px ${clipRight}px 0px 0px round 12px)`;
  }

  /** Grows the pill to its open width, then reveals the panel from the trigger outwards. */
  async function expand() {
    const id = ++transitionId;
    cancelAnimations();

    const startWidth = rootElement?.getBoundingClientRect().width ?? 0;
    expanded = true;
    await tick();
    if (id !== transitionId) return;

    const endWidth = rootElement?.getBoundingClientRect().width ?? startWidth;
    await play(rootElement, [{ width: `${startWidth}px` }, { width: `${endWidth}px` }], WIDTH_OPEN_MS, OPEN_EASING);
    if (id !== transitionId) return;

    clipFrom = measureTriggerClip();
    revealed = true;
    await play(panelElement, [{ clipPath: clipFrom }, { clipPath: CLIP_OPEN }], REVEAL_MS, OPEN_EASING);
  }

  /** Folds the panel back into the trigger, then shrinks the pill to its resting width. */
  async function collapse() {
    const id = ++transitionId;
    cancelAnimations();

    await play(panelElement, [{ clipPath: CLIP_OPEN }, { clipPath: clipFrom }], CONCEAL_MS, CLOSE_EASING, 'forwards');
    if (id !== transitionId) return;

    revealed = false;
    await tick();
    cancelAnimations();
    const startWidth = rootElement?.getBoundingClientRect().width ?? 0;
    expanded = false;
    await tick();
    if (id !== transitionId) return;

    const endWidth = rootElement?.getBoundingClientRect().width ?? startWidth;
    await play(rootElement, [{ width: `${startWidth}px` }, { width: `${endWidth}px` }], WIDTH_CLOSE_MS, CLOSE_EASING);
    if (id !== transitionId) return;

    const activeElement = document.activeElement;
    const shouldRestoreFocus =
      !activeElement || activeElement === document.body || rootElement?.contains(activeElement);
    if (shouldRestoreFocus) triggerElement?.focus();
  }

  $effect(() => {
    if (open === previousOpen) return;

    previousOpen = open;
    if (open) {
      void expand();
    } else {
      void collapse();
    }
  });

  onDestroy(cancelAnimations);
</script>

<div
  bind:this={rootElement}
  class={cn(
    'ui:border-border ui:bg-card ui:relative ui:flex ui:h-11 ui:items-center ui:overflow-hidden ui:rounded-xl ui:border ui:shadow-md',
    expanded ? 'ui:w-full ui:max-w-md' : 'ui:w-fit'
  )}
  data-testid={testId}
>
  <button
    bind:this={triggerElement}
    type="button"
    class="ui:text-foreground ui:flex ui:h-full ui:shrink-0 ui:cursor-pointer ui:items-center ui:gap-3 ui:rounded-xl ui:py-2 ui:pr-2.5 ui:pl-4 ui:text-[15px] ui:font-semibold ui:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring/50"
    aria-expanded={open}
    data-testid={triggerTestId}
    inert={revealed}
    onclick={onOpen}
  >
    <SparklesIcon size={16} class="custom ui:text-primary" />
    {label}
    {#if shortcut}
      <span class="ui:bg-border ui:w-px ui:self-stretch" aria-hidden="true"></span>
      <span class="ui:flex ui:gap-1">
        {#each [shortcut.modifier, shortcut.key] as key (key)}
          <kbd
            class="ui:bg-muted ui:text-muted-foreground ui:inline-grid ui:h-6 ui:min-w-6 ui:place-items-center ui:rounded-md ui:px-[5px] ui:font-sans ui:text-xs ui:font-semibold"
            >{key}</kbd
          >
        {/each}
      </span>
    {/if}
  </button>

  <div
    bind:this={panelElement}
    class={cn(
      'ui:bg-card ui:absolute ui:inset-0 ui:flex ui:items-center ui:px-3',
      revealed ? 'ui:opacity-100' : 'ui:pointer-events-none ui:opacity-0'
    )}
    style:clip-path={revealed ? CLIP_OPEN : clipFrom}
    inert={!open}
    role="group"
    aria-label={panelLabel}
    data-testid={panelTestId}
  >
    {@render panel()}
  </div>
</div>
