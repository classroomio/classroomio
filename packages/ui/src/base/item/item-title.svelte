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
  data-slot="item-title"
  class={cn('ui:flex ui:w-fit ui:items-center ui:gap-2 ui:text-sm ui:font-medium ui:leading-snug', className)}
  {...restProps}
>
  {@render children?.()}
</div>
