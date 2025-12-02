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
  data-slot="empty-header"
  class={cn('ui:flex ui:max-w-sm ui:flex-col ui:items-center ui:gap-2 ui:text-center', className)}
  {...restProps}
>
  {@render children?.()}
</div>
