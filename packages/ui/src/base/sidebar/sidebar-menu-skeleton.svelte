<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import { Skeleton } from '../skeleton';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    showIcon = false,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    showIcon?: boolean;
  } = $props();

  // Random width between 50% and 90%
  const width = `${Math.floor(Math.random() * 40) + 50}%`;
</script>

<div
  bind:this={ref}
  data-slot="sidebar-menu-skeleton"
  data-sidebar="menu-skeleton"
  class={cn('ui:flex ui:h-8 ui:items-center ui:gap-2 ui:rounded-md ui:px-2', className)}
  {...restProps}
>
  {#if showIcon}
    <Skeleton class="ui:size-4 ui:rounded-md" data-sidebar="menu-skeleton-icon" />
  {/if}
  <Skeleton
    class="ui:max-w-(--skeleton-width) ui:h-4 ui:flex-1"
    data-sidebar="menu-skeleton-text"
    style="--skeleton-width: {width};"
  />
  {@render children?.()}
</div>
