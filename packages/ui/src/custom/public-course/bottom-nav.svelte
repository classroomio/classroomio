<script lang="ts">
  import type { Snippet } from 'svelte';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ListIcon from '@lucide/svelte/icons/list';
  import { cn } from '../../tools';

  interface Props {
    /** Current position — e.g. "3 of 12" — plus a subline — e.g. "Hallucination & limitations". */
    positionLabel: string;
    sublineLabel?: string;
    /** When true, a filled check is shown to the right of `sublineLabel`. */
    sublineComplete?: boolean;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onOpenSheet: () => void;
    /** a11y label for the center button (defaults to "Open course outline"). */
    openSheetLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
    /** Center button style: list icon (public default) or progress ring (student mobile). */
    centerVariant?: 'list' | 'ring';
    /** 0–100 progress for the ring variant. */
    progressPercent?: number;
    /** Optional control rendered between the title button and next, e.g. mark-complete. */
    completeToggle?: Snippet;
    class?: string;
  }

  let {
    positionLabel,
    sublineLabel,
    sublineComplete = false,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onOpenSheet,
    openSheetLabel = 'Open course outline',
    prevLabel = 'Previous lesson',
    nextLabel = 'Next lesson',
    centerVariant = 'list',
    progressPercent = 0,
    completeToggle,
    class: className
  }: Props = $props();

  const navButtonClass =
    'ui:inline-flex ui:items-center ui:justify-center ui:rounded-md ui:px-3 ui:py-3 ui:text-foreground ui:transition-[background,transform] ui:duration-100 ui:hover:bg-muted ui:active:scale-[0.94] ui:active:bg-muted ui:disabled:opacity-30 ui:disabled:active:scale-100';

  const centerButtonClass =
    'ui:flex ui:flex-1 ui:min-w-0 ui:items-center ui:justify-center ui:gap-2 ui:rounded-md ui:px-3 ui:py-2 ui:text-center ui:transition-[background,transform] ui:duration-100 ui:hover:bg-muted ui:active:scale-[0.98] ui:active:bg-muted';

  const ringCircumference = 94.2;
  const ringOffset = $derived(
    ringCircumference - (ringCircumference * Math.min(100, Math.max(0, progressPercent))) / 100
  );
  const ringLabel = $derived(`${Math.round(progressPercent)}%`);
</script>

<nav
  class={cn(
    'ui:fixed ui:inset-x-0 ui:bottom-0 ui:z-40 ui:flex ui:items-stretch ui:gap-1 ui:border-t ui:border-border ui:bg-background/95 ui:p-1.5 ui:backdrop-blur ui:lg:hidden',
    className
  )}
  aria-label="Lesson navigation"
>
  <button type="button" class={navButtonClass} aria-label={prevLabel} disabled={!hasPrev} onclick={onPrev}>
    <ChevronLeftIcon class="ui:size-5" />
  </button>

  <button type="button" class={centerButtonClass} aria-label={openSheetLabel} onclick={onOpenSheet}>
    {#if centerVariant === 'ring'}
      <svg class="ui:size-7 ui:shrink-0" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" class="ui:stroke-border" stroke-width="3"></circle>
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          class="ui:stroke-primary"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray={ringCircumference}
          stroke-dashoffset={ringOffset}
          transform="rotate(-90 18 18)"
        ></circle>
        <text
          x="18"
          y="19"
          text-anchor="middle"
          dominant-baseline="middle"
          class="ui:fill-primary ui:text-[9px] ui:font-bold"
        >
          {ringLabel}
        </text>
      </svg>
    {:else}
      <ListIcon class="ui:size-4 ui:text-primary" />
    {/if}
    <span class="ui:flex ui:min-w-0 ui:flex-col ui:items-start ui:text-left ui:leading-tight">
      <span class="ui:text-[0.7rem] ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
        {positionLabel}
      </span>
      {#if sublineLabel}
        <span class="ui:flex ui:max-w-[55vw] ui:min-w-0 ui:items-center ui:gap-1">
          <span class="ui:min-w-0 ui:truncate ui:text-sm ui:font-medium ui:text-foreground">{sublineLabel}</span>
          {#if sublineComplete}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              class="ui:size-3.5 ui:shrink-0 ui:text-primary"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
              <path d="m9 12 2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {/if}
        </span>
      {/if}
    </span>
  </button>

  {#if completeToggle}
    {@render completeToggle()}
  {/if}

  <button type="button" class={navButtonClass} aria-label={nextLabel} disabled={!hasNext} onclick={onNext}>
    <ChevronRightIcon class="ui:size-5" />
  </button>
</nav>
