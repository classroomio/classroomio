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
  role="list"
  data-slot="item-group"
  class={cn('ui:group/item-group ui:flex ui:flex-col', className)}
  {...restProps}
>
  {@render children?.()}
</div>
