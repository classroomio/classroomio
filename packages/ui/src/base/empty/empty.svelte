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
  data-slot="empty"
  class={cn(
    'ui:flex ui:min-w-0 ui:flex-1 ui:flex-col ui:items-center ui:justify-center ui:gap-6 ui:text-balance ui:rounded-lg ui:border-dashed ui:p-6 ui:text-center ui:md:p-12',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
