<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    children,
    child,
    class: className,
    size = 'md',
    isActive = false,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
    size?: 'sm' | 'md';
    isActive?: boolean;
  } = $props();

  const mergedProps = $derived({
    class: cn(
      'ui:text-sidebar-foreground ui:ring-sidebar-ring ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground ui:active:bg-sidebar-accent ui:active:text-sidebar-accent-foreground ui:[&>svg]:text-sidebar-accent-foreground ui:outline-hidden ui:flex ui:h-7 ui:min-w-0 ui:-translate-x-px ui:items-center ui:gap-2 ui:overflow-hidden ui:rounded-md ui:px-2 ui:focus-visible:ring-2 ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:aria-disabled:pointer-events-none ui:aria-disabled:opacity-50 ui:[&>span:last-child]:truncate ui:[&>svg]:size-4 ui:[&>svg]:shrink-0',
      'ui:data-[active=true]:bg-sidebar-accent ui:data-[active=true]:text-sidebar-accent-foreground',
      size === 'sm' && 'ui:text-xs',
      size === 'md' && 'ui:text-sm',
      'ui:group-data-[collapsible=icon]:hidden',
      className
    ),
    'data-slot': 'sidebar-menu-sub-button',
    'data-sidebar': 'menu-sub-button',
    'data-size': size,
    'data-active': isActive,
    ...restProps
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <a bind:this={ref} {...mergedProps}>
    {@render children?.()}
  </a>
{/if}
