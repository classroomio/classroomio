<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    sticky = false,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    /**
     * Pin the footer to the bottom of the scrolling `Dialog.Content` so
     * the primary action stays visible in tall dialogs. We use plain
     * `bottom: 0` (no negative offset) because `overflow-y-auto` clips
     * sticky children at the padding box — pushing the footer past that
     * line makes it disappear entirely. A top border + solid background
     * separates the footer from the scrolling content behind it; negative
     * horizontal margins bleed past Content's `px-6` so the border spans
     * edge-to-edge.
     */
    sticky?: boolean;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="dialog-footer"
  data-sticky={sticky ? 'true' : undefined}
  class={cn(
    'ui:flex ui:flex-col-reverse ui:gap-2 ui:sm:flex-row ui:sm:justify-end',
    sticky && 'ui:bg-background ui:sticky ui:bottom-0 ui:z-10 ui:-mx-6 ui:-mb-6 ui:border-t ui:px-6 ui:py-4',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
