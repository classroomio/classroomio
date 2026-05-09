<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ListIcon from '@lucide/svelte/icons/list';
  import { cn } from '../../tools';

  interface Props {
    /** Current position — e.g. "3 of 12" — plus a subline — e.g. "Hallucination & limitations". */
    positionLabel: string;
    sublineLabel?: string;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onOpenSheet: () => void;
    /** a11y label for the center button (defaults to "Open course outline"). */
    openSheetLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
    class?: string;
  }

  let {
    positionLabel,
    sublineLabel,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onOpenSheet,
    openSheetLabel = 'Open course outline',
    prevLabel = 'Previous lesson',
    nextLabel = 'Next lesson',
    class: className
  }: Props = $props();
</script>

<nav
  class={cn(
    'ui:fixed ui:inset-x-0 ui:bottom-0 ui:z-40 ui:flex ui:items-stretch ui:gap-1 ui:border-t ui:border-border ui:bg-background/95 ui:p-1.5 ui:backdrop-blur ui:lg:hidden',
    className
  )}
  aria-label="Lesson navigation"
>
  <button
    type="button"
    class="ui:inline-flex ui:items-center ui:justify-center ui:rounded-md ui:px-3 ui:py-3 ui:text-foreground ui:transition-colors ui:hover:bg-muted ui:disabled:opacity-30"
    aria-label={prevLabel}
    disabled={!hasPrev}
    onclick={onPrev}
  >
    <ChevronLeftIcon class="ui:size-5" />
  </button>

  <button
    type="button"
    class="ui:flex ui:flex-1 ui:items-center ui:justify-center ui:gap-2 ui:rounded-md ui:px-3 ui:py-2 ui:text-center ui:transition-colors ui:hover:bg-muted"
    aria-label={openSheetLabel}
    onclick={onOpenSheet}
  >
    <ListIcon class="ui:size-4 ui:text-primary" />
    <span class="ui:flex ui:min-w-0 ui:flex-col ui:items-start ui:text-left ui:leading-tight">
      <span class="ui:text-[0.7rem] ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
        {positionLabel}
      </span>
      {#if sublineLabel}
        <span class="ui:max-w-[55vw] ui:truncate ui:text-sm ui:font-medium ui:text-foreground">{sublineLabel}</span>
      {/if}
    </span>
  </button>

  <button
    type="button"
    class="ui:inline-flex ui:items-center ui:justify-center ui:rounded-md ui:px-3 ui:py-3 ui:text-foreground ui:transition-colors ui:hover:bg-muted ui:disabled:opacity-30"
    aria-label={nextLabel}
    disabled={!hasNext}
    onclick={onNext}
  >
    <ChevronRightIcon class="ui:size-5" />
  </button>
</nav>
