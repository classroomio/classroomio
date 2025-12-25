<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    child,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const mergedProps = $derived({
    ...restProps,
    class: cn(
      "ui:bg-muted ui:shadow-xs ui:flex ui:items-center ui:gap-2 ui:rounded-md ui:border ui:px-4 ui:text-sm ui:font-medium ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none",
      className
    )
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <div bind:this={ref} {...mergedProps}>
    {@render mergedProps.children?.()}
  </div>
{/if}
