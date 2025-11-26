<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    child,
    ...restProps
  }: WithElementRef<HTMLButtonAttributes> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const mergedProps = $derived({
    class: cn(
<<<<<<< HEAD
      'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-hidden absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
      // Increases the hit area of the button on mobile.
      'after:absolute after:-inset-2 md:after:hidden',
      'group-data-[collapsible=icon]:hidden',
=======
      'ui:text-sidebar-foreground ui:ring-sidebar-ring ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground ui:outline-hidden ui:absolute ui:right-3 ui:top-3.5 ui:flex aspect-square ui:w-5 ui:items-center ui:justify-center ui:rounded-md ui:p-0 ui:transition-transform ui:focus-visible:ring-2 ui:[&>svg]:size-4 ui:[&>svg]:shrink-0',
      // Increases the hit area of the button on mobile.
      'ui:after:absolute ui:after:-inset-2 ui:md:after:hidden',
      'ui:group-data-[collapsible=icon]:hidden',
>>>>>>> feat/release-v2
      className
    ),
    'data-slot': 'sidebar-group-action',
    'data-sidebar': 'group-action',
    ...restProps
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <button bind:this={ref} {...mergedProps}>
    {@render children?.()}
  </button>
{/if}
