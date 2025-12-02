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
  data-slot="empty-content"
  class={cn(
    'ui:flex ui:w-full ui:min-w-0 ui:max-w-sm ui:flex-col ui:items-center ui:gap-4 ui:text-balance ui:text-sm',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
