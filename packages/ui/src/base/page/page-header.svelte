<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    isSticky = false,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    isSticky?: boolean;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="page-header"
  class={cn('ui:flex ui:my-4 ui:flex-col', isSticky && 'ui:sticky ui:top-13 ui:z-10 ui:bg-white', className)}
  {...restProps}
>
  <div class="ui:flex ui:items-start ui:justify-between ui:gap-4">
    {@render children?.()}
  </div>
</div>
