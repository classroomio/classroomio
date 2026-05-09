<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { cn } from '../../tools';
  import type { PublicCourseSidebarItem } from './types';

  interface Props {
    /** Previous item (or `null` if on the first item). */
    prev?: PublicCourseSidebarItem | null;
    /** Next item (or `null` if on the last item). */
    next?: PublicCourseSidebarItem | null;
    /** Builds the href for a target item. Falls back to plain buttons if omitted. */
    hrefFor?: (item: PublicCourseSidebarItem) => string;
    /** Click handler — used when `hrefFor` is omitted, or for SPA navigation alongside `href`. */
    onNavigate?: (item: PublicCourseSidebarItem) => void;
    /** Localized labels for the prev / next captions. */
    prevLabel?: string;
    nextLabel?: string;
    class?: string;
  }

  let {
    prev = null,
    next = null,
    hrefFor,
    onNavigate,
    prevLabel = 'Previous',
    nextLabel = 'Next',
    class: className
  }: Props = $props();

  const cardClass =
    'ui:group ui:flex ui:flex-1 ui:items-center ui:gap-3 ui:rounded-lg ui:border ui:border-border ui:bg-background ui:px-4 ui:py-3 ui:text-left ui:transition-colors ui:hover:border-primary/40 ui:hover:bg-muted/50';

  const prevHref = $derived(prev ? hrefFor?.(prev) : undefined);
  const nextHref = $derived(next ? hrefFor?.(next) : undefined);
</script>

{#snippet prevBody(item: PublicCourseSidebarItem, label: string)}
  <ArrowLeftIcon class="ui:size-4 ui:text-muted-foreground ui:group-hover:text-primary" />
  <div class="ui:flex ui:min-w-0 ui:flex-col">
    <span class="ui:text-xs ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
      {label}
    </span>
    <span class="ui:truncate ui:text-sm ui:font-medium ui:text-foreground ui:group-hover:text-primary">
      {item.title}
    </span>
  </div>
{/snippet}

{#snippet nextBody(item: PublicCourseSidebarItem, label: string)}
  <div class="ui:flex ui:min-w-0 ui:flex-col ui:items-end">
    <span class="ui:text-xs ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
      {label}
    </span>
    <span class="ui:truncate ui:text-sm ui:font-medium ui:text-foreground ui:group-hover:text-primary">
      {item.title}
    </span>
  </div>
  <ArrowRightIcon class="ui:size-4 ui:text-muted-foreground ui:group-hover:text-primary" />
{/snippet}

{#if prev || next}
  <nav
    class={cn('ui:mt-12 ui:flex ui:flex-col ui:gap-3 ui:border-t ui:border-border ui:pt-6 ui:sm:flex-row', className)}
    aria-label="Lesson navigation"
  >
    {#if prev}
      {#if prevHref}
        <a href={prevHref} class={cardClass} onclick={() => onNavigate?.(prev)}>
          {@render prevBody(prev, prevLabel)}
        </a>
      {:else}
        <button type="button" class={cardClass} onclick={() => onNavigate?.(prev)}>
          {@render prevBody(prev, prevLabel)}
        </button>
      {/if}
    {:else}
      <div class="ui:flex-1"></div>
    {/if}

    {#if next}
      {#if nextHref}
        <a href={nextHref} class={cn(cardClass, 'ui:justify-end ui:text-right')} onclick={() => onNavigate?.(next)}>
          {@render nextBody(next, nextLabel)}
        </a>
      {:else}
        <button type="button" class={cn(cardClass, 'ui:justify-end ui:text-right')} onclick={() => onNavigate?.(next)}>
          {@render nextBody(next, nextLabel)}
        </button>
      {/if}
    {:else}
      <div class="ui:flex-1"></div>
    {/if}
  </nav>
{/if}
