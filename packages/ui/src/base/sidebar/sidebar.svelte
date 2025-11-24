<script lang="ts">
  import * as Sheet from '../sheet';
  import { cn, type WithElementRef } from '../../../src/tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import { SIDEBAR_WIDTH_MOBILE } from './constants.js';
  import { useSidebar } from './context.svelte';

  let {
    ref = $bindable(null),
    side = 'left',
    variant = 'sidebar',
    collapsible = 'offcanvas',
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  } = $props();

  const sidebar = useSidebar();
</script>

{#if collapsible === 'none'}
  <div
    class={cn(
      'ui:bg-sidebar ui:text-sidebar-foreground ui:w-(--sidebar-width) ui:flex ui:h-full ui:flex-col',
      className
    )}
    bind:this={ref}
    {...restProps}
  >
    {@render children?.()}
  </div>
{:else if sidebar.isMobile}
  <Sheet.Root bind:open={() => sidebar.openMobile, (v) => sidebar.setOpenMobile(v)} {...restProps}>
    <Sheet.Content
      data-sidebar="sidebar"
      data-slot="sidebar"
      data-mobile="true"
      class="ui:bg-sidebar ui:text-sidebar-foreground ui:w-(--sidebar-width) ui:p-0 ui:[&>button]:hidden"
      style="--sidebar-width: {SIDEBAR_WIDTH_MOBILE};"
      {side}
    >
      <Sheet.Header class="sr-only">
        <Sheet.Title>Sidebar</Sheet.Title>
        <Sheet.Description>Displays the mobile sidebar.</Sheet.Description>
      </Sheet.Header>
      <div class="ui:flex ui:h-full ui:w-full ui:flex-col">
        {@render children?.()}
      </div>
    </Sheet.Content>
  </Sheet.Root>
{:else}
  <div
    bind:this={ref}
    class="ui:text-sidebar-foreground ui:hidden ui:md:block ui:group ui:peer"
    data-state={sidebar.state}
    data-collapsible={sidebar.state === 'collapsed' ? collapsible : ''}
    data-variant={variant}
    data-side={side}
    data-slot="sidebar"
  >
    <!-- This is what handles the sidebar gap on desktop -->
    <div
      data-slot="sidebar-gap"
      class={cn(
        'ui:w-(--sidebar-width) ui:relative ui:bg-transparent ui:transition-[width] ui:duration-200 ui:ease-linear',
        'ui:group-data-[collapsible=offcanvas]:w-0',
        'ui:group-data-[side=right]:rotate-180',
        variant === 'floating' || variant === 'inset'
          ? 'ui:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
          : 'ui:group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
      )}
    ></div>
    <div
      data-slot="sidebar-container"
      class={cn(
        'ui:w-(--sidebar-width) ui:fixed ui:inset-y-0 ui:z-10 ui:hidden ui:max-h-svh ui:transition-[left,right,width] ui:duration-200 ui:ease-linear ui:md:flex',
        side === 'left'
          ? 'ui:left-0 ui:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
          : 'ui:right-0 ui:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
        // Adjust the padding for floating and inset variants.
        variant === 'floating' || variant === 'inset'
          ? 'ui:p-2 ui:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
          : 'ui:group-data-[collapsible=icon]:w-(--sidebar-width-icon) ui:group-data-[side=left]:border-r ui:group-data-[side=right]:border-l',
        className
      )}
      {...restProps}
    >
      <div
        data-sidebar="sidebar"
        data-slot="sidebar-inner"
        class="ui:bg-sidebar ui:group-data-[variant=floating]:border-sidebar-border ui:flex ui:h-full ui:w-full ui:flex-col ui:group-data-[variant=floating]:rounded-lg ui:group-data-[variant=floating]:border ui:group-data-[variant=floating]:shadow-sm"
      >
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
