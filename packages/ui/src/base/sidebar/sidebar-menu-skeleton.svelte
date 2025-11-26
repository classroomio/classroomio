<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import { Skeleton } from '$src/base/skeleton/index.js';
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
<<<<<<< HEAD
  class={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
  {...restProps}
>
  {#if showIcon}
    <Skeleton class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
  {/if}
  <Skeleton
    class="max-w-(--skeleton-width) h-4 flex-1"
=======
  class={cn('ui:flex ui:h-8 ui:items-center ui:gap-2 ui:rounded-md ui:px-2', className)}
  {...restProps}
>
  {#if showIcon}
    <Skeleton class="ui:size-4 ui:rounded-md" data-sidebar="menu-skeleton-icon" />
  {/if}
  <Skeleton
    class="ui:max-w-(--skeleton-width) ui:h-4 ui:flex-1"
>>>>>>> feat/release-v2
    data-sidebar="menu-skeleton-text"
    style="--skeleton-width: {width};"
  />
  {@render children?.()}
</div>
