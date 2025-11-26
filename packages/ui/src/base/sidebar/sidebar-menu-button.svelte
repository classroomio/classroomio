<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const sidebarMenuButtonVariants = tv({
<<<<<<< HEAD
    base: 'peer/menu-button outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_var(--sidebar-border)] hover:shadow-[0_0_0_1px_var(--sidebar-accent)]'
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'group-data-[collapsible=icon]:p-0! h-12 text-sm'
=======
    base: 'ui:peer/menu-button ui:cursor-pointer ui:outline-hidden ui:ring-sidebar-ring ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground ui:group-has-data-[sidebar=menu-action]/menu-item:pr-8 ui:data-[active=true]:bg-sidebar-accent ui:data-[active=true]:text-sidebar-accent-foreground ui:data-[state=open]:hover:bg-sidebar-accent ui:data-[state=open]:hover:text-sidebar-accent-foreground ui:group-data-[collapsible=icon]:size-8! ui:group-data-[collapsible=icon]:p-2! ui:flex ui:w-full ui:items-center ui:gap-2 ui:overflow-hidden ui:rounded-md ui:p-2 ui:text-left ui:text-sm ui:transition-[width,height,padding] ui:focus-visible:ring-2 ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:aria-disabled:pointer-events-none ui:aria-disabled:opacity-50 ui:data-[active=true]:font-medium ui:[&>span:last-child]:truncate ui:[&>svg]:size-4 ui:[&>svg]:shrink-0',
    variants: {
      variant: {
        default: 'ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground',
        outline:
          'ui:bg-background ui:hover:bg-sidebar-accent ui:hover:text-sidebar-accent-foreground ui:shadow-[0_0_0_1px_var(--sidebar-border)] ui:hover:shadow-[0_0_0_1px_var(--sidebar-accent)]'
      },
      size: {
        default: 'ui:h-8 ui:text-sm',
        sm: 'ui:h-7 ui:text-xs',
        lg: 'ui:group-data-[collapsible=icon]:p-0! ui:h-12 ui:text-sm'
>>>>>>> feat/release-v2
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  export type SidebarMenuButtonVariant = VariantProps<typeof sidebarMenuButtonVariants>['variant'];
  export type SidebarMenuButtonSize = VariantProps<typeof sidebarMenuButtonVariants>['size'];
</script>

<script lang="ts">
  import * as Tooltip from '$src/base/tooltip/index.js';
  import { cn, type WithElementRef, type WithoutChildrenOrChild } from '../../tools';
  import { mergeProps } from 'bits-ui';
  import type { ComponentProps, Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
<<<<<<< HEAD
  import { useSidebar } from './context.svelte.js';
=======
  import { useSidebar } from './context.svelte';
>>>>>>> feat/release-v2

  let {
    ref = $bindable(null),
    class: className,
    children,
    child,
    variant = 'default',
    size = 'default',
    isActive = false,
    tooltipContent,
    tooltipContentProps,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    isActive?: boolean;
    variant?: SidebarMenuButtonVariant;
    size?: SidebarMenuButtonSize;
    tooltipContent?: Snippet | string;
    tooltipContentProps?: WithoutChildrenOrChild<ComponentProps<typeof Tooltip.Content>>;
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const sidebar = useSidebar();

  const buttonProps = $derived({
    class: cn(sidebarMenuButtonVariants({ variant, size }), className),
    'data-slot': 'sidebar-menu-button',
    'data-sidebar': 'menu-button',
    'data-size': size,
    'data-active': isActive,
    ...restProps
  });
</script>

{#snippet Button({ props }: { props?: Record<string, unknown> })}
  {@const mergedProps = mergeProps(buttonProps, props)}
  {#if child}
    {@render child({ props: mergedProps })}
  {:else}
    <button bind:this={ref} {...mergedProps}>
      {@render children?.()}
    </button>
  {/if}
{/snippet}

{#if !tooltipContent}
  {@render Button({})}
{:else}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        {@render Button({ props })}
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content
      side="right"
      align="center"
      hidden={sidebar.state !== 'collapsed' || sidebar.isMobile}
      {...tooltipContentProps}
    >
      {#if typeof tooltipContent === 'string'}
        {tooltipContent}
      {:else if tooltipContent}
        {@render tooltipContent()}
      {/if}
    </Tooltip.Content>
  </Tooltip.Root>
{/if}
