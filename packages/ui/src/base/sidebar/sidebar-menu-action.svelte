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
      'ui:text-sidebar-foreground ui:ring-sidebar-ring ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground ui:peer-hover/menu-button:text-sidebar-accent-foreground ui:outline-hidden ui:absolute ui:right-1 ui:top-1.5 ui:flex aspect-square ui:w-5 ui:items-center ui:justify-center ui:rounded-md ui:p-0 ui:transition-transform ui:focus-visible:ring-2 ui:[&>svg]:size-4 ui:[&>svg]:shrink-0',
      // Increases the hit area of the button on mobile.
      'ui:after:absolute ui:after:-inset-2 ui:md:after:hidden',
      'ui:peer-data-[size=sm]/menu-button:top-1',
      'ui:peer-data-[size=default]/menu-button:top-1.5',
      'ui:peer-data-[size=lg]/menu-button:top-2.5',
      'ui:group-data-[collapsible=icon]:hidden',
      showOnHover &&
        'ui:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground ui:group-focus-within/menu-item:opacity-100 ui:group-hover/menu-item:opacity-100 ui:data-[state=open]:opacity-100 ui:md:opacity-0',
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
