<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  /**
   * The sticky bar that rises from the bottom of a page when there is something
   * pending: unsaved changes, or a selection waiting for an action.
   *
   * It owns only the shell. What sits inside is the caller's, so the settings
   * save bar and a table's selection bar can look identical without either
   * re-implementing the pill.
   *
   * `status` is announced politely to screen readers whenever the bar is shown,
   * because the bar appearing is itself the notification.
   */
  let {
    ref = $bindable(null),
    class: className,
    contentClass: contentClassName,
    show = false,
    status,
    fixed = false,
    badge,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    contentClass?: string;
    /** Renders only while true; the bar is an interruption, not furniture. */
    show?: boolean;
    /**
     * Sticky by default, settling into the flow at the end of the page, which
     * suits a save bar. Set this to pin the bar to the viewport instead, which
     * is the only option that survives an ancestor with `overflow` other than
     * `visible`: `Page.Body` sets `overflow-x-hidden`, so a bar rendered
     * through its `child` snippet renders flat at the end of the content
     * unless it is pinned.
     *
     * A boolean rather than a `'sticky' | 'fixed'` union on purpose. The
     * `ui:` prefix script rewrites class-like string literals, and it turns
     * `position === 'fixed'` into `position === 'ui:fixed'`, which silently
     * never matches.
     */
    fixed?: boolean;
    /** Short description of why the bar is up. Also the live-region text. */
    status: string;
    /** Optional marker before the status, such as the unsaved-changes dot. */
    badge?: Snippet;
    children: Snippet;
  } = $props();
</script>

<div class="ui:sr-only" role="status" aria-atomic="true" aria-live="polite">
  {show ? status : ''}
</div>

{#if show}
  <div
    bind:this={ref}
    data-slot="page-floating-bar"
    data-testid="page-floating-bar"
    class={cn(
      'ui:pointer-events-none ui:z-50 ui:flex ui:shrink-0 ui:justify-center ui:px-2 ui:pb-4',
      fixed ? 'ui:fixed ui:inset-x-0 ui:bottom-0' : 'ui:sticky ui:bottom-0',
      className
    )}
    {...restProps}
  >
    <div
      class={cn(
        'ui:pointer-events-auto ui:flex ui:w-fit ui:max-w-full ui:flex-wrap ui:items-center ui:justify-center ui:gap-x-6 ui:gap-y-2 ui:rounded-lg ui:bg-foreground ui:px-3.5 ui:py-2 ui:text-background ui:shadow-lg',
        contentClassName
      )}
    >
      <div class="ui:flex ui:min-w-0 ui:items-center ui:gap-2">
        {#if badge}
          {@render badge()}
        {/if}
        <p class="ui:text-sm ui:font-medium">{status}</p>
      </div>

      <div class="ui:flex ui:shrink-0 ui:items-center ui:gap-2">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
