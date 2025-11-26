<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    showOnHover = false,
    children,
    child,
    ...restProps
  }: WithElementRef<HTMLButtonAttributes> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
    showOnHover?: boolean;
  } = $props();

  const mergedProps = $derived({
    class: cn(
<<<<<<< HEAD
      'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground outline-hidden absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
      // Increases the hit area of the button on mobile.
      'after:absolute after:-inset-2 md:after:hidden',
      'peer-data-[size=sm]/menu-button:top-1',
      'peer-data-[size=default]/menu-button:top-1.5',
      'peer-data-[size=lg]/menu-button:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      showOnHover &&
        'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
=======
      'ui:text-sidebar-foreground ui:ring-sidebar-ring ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground ui:peer-hover/menu-button:text-sidebar-accent-foreground ui:outline-hidden ui:absolute ui:right-1 ui:top-1.5 ui:flex aspect-square ui:w-5 ui:items-center ui:justify-center ui:rounded-md ui:p-0 ui:transition-transform ui:focus-visible:ring-2 ui:[&>svg]:size-4 ui:[&>svg]:shrink-0',
      // Increases the hit area of the button on mobile.
      'ui:after:absolute ui:after:-inset-2 ui:md:after:hidden',
      'ui:peer-data-[size=sm]/menu-button:top-1',
      'ui:peer-data-[size=default]/menu-button:top-1.5',
      'ui:peer-data-[size=lg]/menu-button:top-2.5',
      'ui:group-data-[collapsible=icon]:hidden',
      showOnHover &&
        'ui:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 ui:data-[state=open]:opacity-100 ui:md:opacity-0',
>>>>>>> feat/release-v2
      className
    ),
    'data-slot': 'sidebar-menu-action',
    'data-sidebar': 'menu-action',
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
