<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    children,
    child,
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const mergedProps = $derived({
    class: cn(
<<<<<<< HEAD
      'text-sidebar-foreground/70 ring-sidebar-ring outline-hidden flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
      'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
=======
      'ui:text-sidebar-foreground/70 ui:ring-sidebar-ring ui:outline-hidden ui:flex ui:h-8 ui:shrink-0 ui:items-center ui:rounded-md ui:px-2 ui:text-xs ui:font-medium ui:transition-[margin,opacity] ui:duration-200 ui:ease-linear ui:focus-visible:ring-2 ui:[&>svg]:size-4 ui:[&>svg]:shrink-0',
      'ui:group-data-[collapsible=icon]:-mt-8 ui:group-data-[collapsible=icon]:opacity-0',
>>>>>>> feat/release-v2
      className
    ),
    'data-slot': 'sidebar-group-label',
    'data-sidebar': 'group-label',
    ...restProps
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <div bind:this={ref} {...mergedProps}>
    {@render children?.()}
  </div>
{/if}
