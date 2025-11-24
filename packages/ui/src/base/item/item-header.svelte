<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="item-header"
  class={cn('ui:flex ui:basis-full ui:items-center ui:justify-between ui:gap-2', className)}
  {...restProps}
>
  {@render children?.()}
</div>
